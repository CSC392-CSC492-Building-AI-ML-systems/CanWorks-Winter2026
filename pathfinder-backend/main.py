import os
import logging
from uuid import UUID
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi import UploadFile, File # handle file uploads
from fastapi import Depends
from fastapi import Query # Define query parameters with defaults and validation
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func # SQLAlchemy OR operator for combining search conditions
from database import engine, get_db, Base
from models import Job, SavedJob, CareerInsight, FeedLog, JobEvent, Application, JobSkill, Skill
from schemas import JobResponse, JobListResponse, UploadResponse
from schemas import SavedJobCreate, SavedJobResponse, SavedJobWithDetails, SavedJobsResponse, RemovedJobInfo
from schemas import CareerInsightCreate, CareerInsightsResponse, ImageUploadResponse
from schemas import EmployerInfo
from excel_parser import parse_excel_file
from fastapi import HTTPException
import numpy as np
from sentence_transformers import SentenceTransformer
from schemas import JobEventCreate

from routes.job_descriptions import router as job_descriptions_router
from routes.templates import router as templates_router
from routes.skills import router as skills_router
from routes.applications import router as applications_router
from routes.analytics import router as analytics_router
from upload_images import upload_career_images
from gemini_service import extract_job_skills

from jwt_auth import verify_jwt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load embedding model (FastEmbed) once at startup
_embed_model = None

async def load_embedding_model():
    global _embed_model
    # Skip embedding model in production to speed up startup if needed
    load_embeddings = os.getenv("LOAD_EMBEDDINGS", "true").lower() == "true"

    if not load_embeddings:
        logger.info("Embeddings disabled via LOAD_EMBEDDINGS env var")
        return

    try:
        logger.info("Loading embedding model...")
        _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Embedding model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}. Continuing without embeddings.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    # Start the download in the background so it doesn't block Uvicorn from binding the port!
    asyncio.create_task(load_embedding_model())
    yield

app = FastAPI(lifespan=lifespan)
"""
Browsers block requests between different origins by default.
Frontend and backend can run on different ports so to the brwoser, these are different origins.
Middleware allows the communication between the frontend and the backend
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Explicitly allow needed methods
    allow_headers=["*"],  # Allow all headers including Authorization
)

# Tell SQLAlchemy to look at all classes that inherit from Base (Job model in this case)
# and create the table in the database if it doesn't already exist
try:
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)
    # Add employer_website column if it doesn't exist
    with engine.connect() as conn:
        from sqlalchemy import text as sql_text, inspect
        inspector = inspect(engine)
        columns = [c["name"] for c in inspector.get_columns("jobs")]
        if "employer_website" not in columns:
            conn.execute(sql_text("ALTER TABLE jobs ADD COLUMN employer_website VARCHAR"))
            conn.commit()
            logger.info("Added employer_website column to jobs table")
    logger.info("Database initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

def embed_text(text: str):
    global _embed_model
    if not text:
        return None

    if _embed_model is None:
        try:
            logger.info("Loading embedding model lazily...")
            _embed_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return None

    try:
        vec = _embed_model.encode(text)
        return vec.tolist()
    except Exception as e:
        logger.error(f"Failed to embed text: {e}")
        return None

# Health check endpoint for Render
@app.get("/health")
def health_check():
    return {"status": "ok", "embedding_model_loaded": _embed_model is not None}
app.include_router(job_descriptions_router)
app.include_router(templates_router)
app.include_router(skills_router)
app.include_router(applications_router)
app.include_router(analytics_router)

# Upload endpoint
# register a POST route
# response_model tells FastAPI to validate and serialize the return value using Pydantic schema
@app.post("/api/upload-jobs", response_model=UploadResponse)
async def upload_jobs(file: UploadFile = File(...), db: Session = Depends(get_db)): # The ... indicates that a file is required
    contents = await file.read() # read the uploaded file into memory
    jobs, parse_errors = parse_excel_file(contents)

    jobs_added = 0
    jobs_skipped = 0

    for job_data in jobs:
        existing = db.query(Job).filter(Job.dedupe_hash == job_data["dedupe_hash"]).first()
        if existing:
            jobs_skipped += 1
            continue

        # Extract skills_raw and uploaded_by before passing to Job constructor
        skills_raw = job_data.pop("skills_raw", [])
        uploaded_by = job_data.pop("uploaded_by", "admin")

        db_job = Job(uploaded_by=uploaded_by, status="published", **job_data)
        # compute embedding for job content (title + employer + description)
        try:
            text_blob = ' '.join(filter(None, [str(job_data.get('title', '')), str(job_data.get('employer', '')), str(job_data.get('description', ''))]))
            emb = embed_text(text_blob)
            if emb is not None:
                db_job.embedding = emb
        except Exception:
            pass
        db.add(db_job) # stage the new row
        db.flush()  # flush to get the job id assigned

        # Process skills
        if len(skills_raw) == 0:
            # Get all existing skills from database for Gemini to match against
            existing_skills = [skill.skill_name for skill in db.query(Skill).all()]
            
            # Use Gemini to infer skills if no explicit skills were provided
            try:
                skills_result = extract_job_skills(
                    job_title=job_data.get("title", ""),
                    description=job_data.get("description", ""),
                    responsibilities=job_data.get("responsibilities", ""),
                    qualifications=job_data.get("qualifications", ""),
                    existing_skills=existing_skills
                )
                logger.info(f"Extracted skills for job '{job_data.get('title', '')}': {skills_result}")
                
                # Combine existing and new skills for this job
                skills_raw = skills_result["existing_skills"] + skills_result["new_skills"]
                
                # Add any new skills to the database
                for new_skill_name in skills_result["new_skills"]:
                    new_skill_name = new_skill_name.strip()
                    if not new_skill_name:
                        continue
                    # Check if this new skill already exists (case-insensitive)
                    existing = db.query(Skill).filter(
                        Skill.skill_name.ilike(new_skill_name)
                    ).first()
                    if not existing:
                        new_skill = Skill(skill_name=new_skill_name)
                        db.add(new_skill)
                        db.flush()
                        logger.info(f"Added new skill to database: {new_skill_name}")
                        
            except Exception as e:
                logger.error(f"Failed to extract skills for job '{job_data.get('title', '')}': {e}")
                skills_raw = []
            
        for skill_name in skills_raw:
            skill_name_lower = skill_name.strip().lower()
            if not skill_name_lower:
                continue
            # Case-insensitive lookup in Skill table
            skill = db.query(Skill).filter(
                Skill.skill_name.ilike(skill_name_lower)
            ).first()
            if not skill:
                skill = Skill(skill_name=skill_name.strip())
                db.add(skill)
                db.flush()
            job_skill = JobSkill(job_id=db_job.id, skill_id=skill.id, skill_type="required")
            db.add(job_skill)

        jobs_added += 1

    db.commit() 

    #Record feed log entry
    feed_log = FeedLog(
        source=file.filename or "excel_upload",
        status="success" if not parse_errors else "partial",
        jobs_added=jobs_added,
        jobs_skipped=jobs_skipped,
        errors=parse_errors if parse_errors else None,
        uploaded_by=None,  # could be enhanced with auth later
    )
    db.add(feed_log)
    db.commit()

    return UploadResponse(
        jobs_added=jobs_added,
        jobs_skipped=jobs_skipped,
        errors=parse_errors
    )

@app.get("/api/jobs", response_model=JobListResponse)
def get_jobs(
    page: int=Query(default=1, ge=1), # ge means greater than or equal to ensure page is at least 1
    page_size: int=Query(default=20, ge=1, le=100), # le means less than or equal to ensure a page doesn't display more than 100 jobs
    search: str=Query(default=None),
    employment_type: str=Query(default=None),
    mode: str=Query(default=None),
    province: str=Query(default=None),
    target_audience: str=Query(default=None),
    uploaded_by: str=Query(default=None),
    db: Session=Depends(get_db) # This tells FastAPI that before running get_jobs, call get_db and get a database session back then pass it as the db parameter
):
    query = db.query(Job).options(joinedload(Job.skills).joinedload(JobSkill.skill)).filter(Job.status == "published", Job.deleted_at.is_(None))
    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"), # search for substring match
                Job.employer.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%")
            )
        )

    if employment_type:
        query = query.filter(Job.employment_type == employment_type)
    if mode:
        query = query.filter(Job.mode == mode)
    if province:
        query = query.filter(Job.province == province)
    if target_audience:
        query = query.filter(Job.target_audience == target_audience)
    if uploaded_by:
        query = query.filter(Job.uploaded_by == uploaded_by)

    total = query.count()
    # offset = (page - 1) * page_size
    # number of jobs displayed in 1 page = page_size
    jobs = query.offset((page - 1) * page_size).limit(page_size).all()

    return JobListResponse(
        jobs=jobs,
        total=total,
        page=page,
        page_size=page_size
    )

# stats endpoint counting active jobs
@app.get("/api/jobs/stats")
def get_job_stats(db: Session = Depends(get_db)):
    total = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).count()
    return {
        "total_jobs": total
    }

# Single job endpoint
@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.query(Job).options(joinedload(Job.skills).joinedload(JobSkill.skill)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

# -----------------------------
# POST - Save Job
# -----------------------------
@app.post("/api/saved-jobs", response_model=SavedJobResponse)
def save_job(
    payload: SavedJobCreate,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]  # extracted from JWT

    job = db.query(Job).filter(
        Job.id == payload.job_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == payload.job_id
    ).first()

    if existing:
        return existing

    saved = SavedJob(
        user_id=user_id,
        job_id=payload.job_id
    )

    db.add(saved)
    db.commit()
    db.refresh(saved)

    return saved


# -----------------------------
# DELETE - Unsave Job
# -----------------------------
@app.delete("/api/saved-jobs/{job_id}")
def unsave_job(
    job_id: UUID,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    saved = db.query(SavedJob).filter(
        SavedJob.user_id == user_id,
        SavedJob.job_id == job_id
    ).first()

    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found")

    db.delete(saved)
    db.commit()

    return {"message": "Removed from saved jobs"}


# -----------------------------
# GET - Fetch Saved Jobs
# -----------------------------
@app.get("/api/saved-jobs", response_model=SavedJobsResponse)
def get_saved_jobs(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    saved_jobs = db.query(SavedJob).options(
        joinedload(SavedJob.job)
    ).filter(
        SavedJob.user_id == user_id
    ).all()

    active = []
    removed = []
    stale_ids = []

    for sj in saved_jobs:
        if sj.job and sj.job.deleted_at is None:
            active.append(sj)
        else:
            if sj.job:
                removed.append(RemovedJobInfo(title=sj.job.title, employer=sj.job.employer))
            stale_ids.append(sj.id)

    # Auto-clean stale saved job records
    if stale_ids:
        db.query(SavedJob).filter(SavedJob.id.in_(stale_ids)).delete(synchronize_session=False)
        db.commit()

    return SavedJobsResponse(active=active, removed=removed)


# -----------------------------
# DELETE - Admin Delete Job
# -----------------------------
@app.delete("/api/admin/jobs/{job_id}")
def admin_delete_job(
    job_id: UUID,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_meta = user.get("user_metadata", {}).get("userData", {})
    user_type = user_meta.get("userType", "")
    if user_type not in ("admin", "super-admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.deleted_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)

    # Update all applications for this job to "job_deleted"
    db.query(Application).filter(
        Application.job_id == job_id
    ).update({"status": "job_deleted", "updated_at": datetime.now(timezone.utc)})

    db.commit()
    return {"message": "Job deleted"}


# -----------------------------
# GET - Admin List Employers
# -----------------------------
@app.get("/api/admin/employers", response_model=list[EmployerInfo])
def admin_list_employers(
    user=Depends(verify_jwt),
):
    user_meta = user.get("user_metadata", {}).get("userData", {})
    user_type = user_meta.get("userType", "")
    if user_type not in ("admin", "super-admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    from upload_images import _get_supabase

    employers = []
    try:
        client = _get_supabase()
        page = 1
        all_users = []
        while True:
            batch = client.auth.admin.list_users(page=page, per_page=1000)
            if not batch:
                break
            all_users.extend(batch)
            if len(batch) < 1000:
                break
            page += 1

        for u in all_users:
            meta = getattr(u, "user_metadata", None) or {}
            ud = meta.get("userData", {})
            if ud.get("userType") != "employer":
                continue
            contact = ud.get("contactInfo", {})
            employers.append(EmployerInfo(
                id=u.id,
                email=getattr(u, "email", ""),
                company_name=ud.get("companyName", "Unknown"),
                phone=contact.get("phone"),
                website=contact.get("website"),
                address=contact.get("address"),
                available_for_events=ud.get("availableForEvents", False),
                sponsor=ud.get("sponsor", False),
                special_notes=ud.get("specialNotes"),
                created_at=str(getattr(u, "created_at", "")) if getattr(u, "created_at", None) else None,
            ))
    except Exception as e:
        logger.error(f"Failed to fetch employers from Supabase: {e}")

    return employers


@app.post("/api/create-career-insights", response_model=CareerInsightsResponse)
def create_career_insights(
    payload: CareerInsightCreate,
    db: Session = Depends(get_db)
):
    career_insight = CareerInsight(
        title=payload.title,
        category=payload.category,
        excerpt=payload.excerpt,
        content=payload.content,
        articleLink=payload.articleLink,
        imageUrl=payload.imageUrl,
        readTime=payload.readTime,
    )

    db.add(career_insight)
    db.commit()
    db.refresh(career_insight)

    return career_insight


@app.post("/api/upload-career-image", response_model=ImageUploadResponse)
async def upload_career_image(file: UploadFile = File(...)):
    result = await upload_career_images(file)
    return ImageUploadResponse(
        url=result["url"],
        filename=result["filename"]
    )


@app.get("/api/career-insights", response_model=list[CareerInsightsResponse])
def get_career_insights(db: Session = Depends(get_db)):
    insights = db.query(CareerInsight).order_by(CareerInsight.created_at.desc()).all()
    return insights


@app.put("/api/career-insights/{insight_id}", response_model=CareerInsightsResponse)
def update_career_insight(
    insight_id: int,
    payload: CareerInsightCreate,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_meta = user.get("user_metadata", {}).get("userData", {})
    if user_meta.get("userType") not in ("admin", "super-admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    insight = db.query(CareerInsight).filter(CareerInsight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Career insight not found")

    insight.title = payload.title
    insight.category = payload.category
    insight.excerpt = payload.excerpt
    insight.content = payload.content
    insight.articleLink = payload.articleLink
    insight.imageUrl = payload.imageUrl
    insight.readTime = payload.readTime
    db.commit()
    db.refresh(insight)
    return insight


@app.delete("/api/career-insights/{insight_id}")
def delete_career_insight(
    insight_id: int,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_meta = user.get("user_metadata", {}).get("userData", {})
    if user_meta.get("userType") not in ("admin", "super-admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    insight = db.query(CareerInsight).filter(CareerInsight.id == insight_id).first()
    if not insight:
        raise HTTPException(status_code=404, detail="Career insight not found")

    db.delete(insight)
    db.commit()
    return {"message": "Career insight deleted"}


# Public endpoint for students to browse published employer job descriptions
@app.get("/api/published-jobs", response_model=JobListResponse)
def get_published_jobs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str = Query(default=None),
    db: Session = Depends(get_db),
):
    from datetime import date

    query = db.query(Job).options(joinedload(Job.skills).joinedload(JobSkill.skill)).filter(
        Job.uploaded_by == "employer",
        Job.status == "published",
        Job.deleted_at.is_(None),
    ).filter(
        (Job.application_deadline.is_(None)) |
        (Job.application_deadline >= date.today())
    )

    if search:
        query = query.filter(
            or_(
                Job.title.ilike(f"%{search}%"),
                Job.industry.ilike(f"%{search}%"),
                Job.description.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(Job.published_at.desc())
    total = query.count()
    jobs = query.offset((page - 1) * page_size).limit(page_size).all()

    return JobListResponse(
        jobs=jobs,
        total=total,
        page=page,
        page_size=page_size,
    )


# -----------------------------
# POST - Log Job Event (view/save/apply)
# -----------------------------
@app.post("/api/job-events")
def log_job_event(payload: JobEventCreate, user=Depends(verify_jwt), db: Session = Depends(get_db)):
    user_id = user["sub"]

    # ensure job exists
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    event = JobEvent(user_id=user_id, job_id=payload.job_id, event_type=payload.event_type)
    db.add(event)
    db.commit()
    return {"status": "ok"}


# -----------------------------
# GET - Recommendations (content-based)
# -----------------------------
@app.get("/api/recommendations", response_model=JobListResponse)
def get_recommendations(k: int = 10, user=Depends(verify_jwt), db: Session = Depends(get_db)):
    user_id = user["sub"]

    # Extract profile preferences from JWT
    user_meta = user.get("user_metadata", {}).get("userData", {})
    looking_for = user_meta.get("lookingFor", [])  # ["internship", "coop", "new-grad"]
    user_skills = [s.lower() for s in user_meta.get("skills", [])]

    # Map lookingFor to employment_type values (case-insensitive)
    type_map = {
        "internship": ["intern", "internship"],
        "coop": ["coop", "co-op"],
        "new-grad": ["new-grad", "full-time", "full time"],
    }
    preferred_types = set()
    for pref in looking_for:
        preferred_types.update(type_map.get(pref, [pref]))

    # Build base query for candidate jobs
    base_query = db.query(Job).options(
        joinedload(Job.skills).joinedload(JobSkill.skill)
    ).filter(Job.status == "published", Job.deleted_at.is_(None))

    # Pre-filter by employment_type if preferences exist
    if preferred_types:
        filtered = base_query.filter(
            func.lower(Job.employment_type).in_(preferred_types)
        ).all()
        candidates = filtered if filtered else base_query.all()
    else:
        candidates = base_query.all()

    # Collect embeddings from saved jobs and recent views and apply weights
    saved = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    view_events = db.query(JobEvent).filter(JobEvent.user_id == user_id, JobEvent.event_type == 'view').order_by(JobEvent.created_at.desc()).limit(20).all()

    emb_vectors = []
    emb_weights = []
    seen_job_ids = set()

    # weights can be tuned via env vars
    weight_saved = float(os.getenv('RECS_WEIGHT_SAVED', 1.0))
    weight_view = float(os.getenv('RECS_WEIGHT_VIEW', 0.2))

    for s in saved:
        try:
            job = s.job
            if job and getattr(job, 'embedding', None) and job.id not in seen_job_ids:
                emb_vectors.append(np.array(job.embedding))
                emb_weights.append(weight_saved)
                seen_job_ids.add(job.id)
        except Exception:
            pass

    for e in view_events:
        if e.job and getattr(e.job, 'embedding', None):
            emb_vectors.append(np.array(e.job.embedding))
            emb_weights.append(weight_view)

    if len(emb_vectors) == 0:
        # fallback: return most recent published jobs
        query = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).order_by(Job.created_at.desc()).limit(k).all()
        total = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).count()
        return JobListResponse(jobs=query, total=total, page=1, page_size=k)

    user_emb = np.mean(np.stack(emb_vectors, axis=0), axis=0)

    # fetch candidate jobs with embeddings
    candidates = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).all()
    scored = []
    for job in candidates:
        if not getattr(job, 'embedding', None):
            continue
        job_emb = np.array(job.embedding)
        # cosine similarity
        sim = float(np.dot(user_emb, job_emb) / (np.linalg.norm(user_emb) * np.linalg.norm(job_emb) + 1e-10))

        # Boost score based on skill overlap with student profile
        if user_skills and job.skills:
            job_skill_names = [s.skill_name.lower() for s in job.skills if s.skill_name]
            matches = len(set(user_skills) & set(job_skill_names))
            sim += 0.1 * matches / max(len(user_skills), 1)

        scored.append((sim, job))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [j for _, j in scored[:k]]
    total = len(scored)
    return JobListResponse(jobs=top, total=total, page=1, page_size=k)

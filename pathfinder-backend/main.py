import os
import logging
from uuid import UUID
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi import UploadFile, File # handle file uploads
from fastapi import Depends
from fastapi import Query # Define query parameters with defaults and validation
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_ # SQLAlchemy OR operator for combining search conditions
from database import engine, get_db, Base
from models import Job, JobSkill, Skill, SavedJob, CareerInsight, FeedLog, JobEvent
from schemas import JobResponse, JobListResponse, UploadResponse
from schemas import SavedJobCreate, SavedJobResponse, SavedJobWithDetails
from schemas import CareerInsightCreate, CareerInsightsResponse, ImageUploadResponse
from excel_parser import parse_excel_file
from fastapi import HTTPException
import numpy as np
from fastembed import TextEmbedding
from schemas import JobEventCreate

from routes.job_descriptions import router as job_descriptions_router
from routes.templates import router as templates_router
from routes.skills import router as skills_router
from routes.applications import router as applications_router
from routes.analytics import router as analytics_router
from routes.startup_contacts import router as startup_contacts_router, public_router as startup_contacts_public_router
from routes.student_resume import router as student_resume_router
from routes.outreach import router as outreach_router
from routes.gmail_auth import router as gmail_auth_router
from upload_images import upload_career_images

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
        _embed_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
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
            _embed_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            return None

    try:
        vec_generator = _embed_model.embed([text])
        vec = next(vec_generator)
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
app.include_router(startup_contacts_router)
app.include_router(startup_contacts_public_router)
app.include_router(student_resume_router)
app.include_router(outreach_router)
app.include_router(gmail_auth_router)

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

    db.commit() # write all staged rows to the database at once

    # Record feed log entry
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
@app.get("/api/saved-jobs", response_model=list[SavedJobWithDetails])
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

    return saved_jobs


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

    # collect embeddings from saved jobs and recent views
    saved = db.query(SavedJob).filter(SavedJob.user_id == user_id).all()
    view_events = db.query(JobEvent).filter(JobEvent.user_id == user_id, JobEvent.event_type == 'view').order_by(JobEvent.created_at.desc()).limit(20).all()

    emb_list = []
    for s in saved:
        if s.job and getattr(s.job, 'embedding', None):
            emb_list.append(np.array(s.job.embedding))
    for e in view_events:
        if e.job and getattr(e.job, 'embedding', None):
            emb_list.append(np.array(e.job.embedding))

    if len(emb_list) == 0:
        # fallback: return most recent published jobs
        query = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).order_by(Job.created_at.desc()).limit(k).all()
        total = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).count()
        return JobListResponse(jobs=query, total=total, page=1, page_size=k)

    user_emb = np.mean(np.stack(emb_list, axis=0), axis=0)

    # fetch candidate jobs with embeddings
    candidates = db.query(Job).filter(Job.status == "published", Job.deleted_at.is_(None)).all()
    scored = []
    for job in candidates:
        if not getattr(job, 'embedding', None):
            continue
        job_emb = np.array(job.embedding)
        # cosine similarity
        sim = float(np.dot(user_emb, job_emb) / (np.linalg.norm(user_emb) * np.linalg.norm(job_emb) + 1e-10))
        scored.append((sim, job))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [j for _, j in scored[:k]]
    total = len(scored)
    return JobListResponse(jobs=top, total=total, page=1, page_size=k)

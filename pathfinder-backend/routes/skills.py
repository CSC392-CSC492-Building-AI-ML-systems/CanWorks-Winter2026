from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import Skill, UserSkill, JobSkill, JobPosting
from schemas import SkillSearchResponse, UserSkillCreate, UserSkillListResponse, UserSkillResponse, SkillResponse, SkillCreate
from jwt_auth import verify_jwt

router = APIRouter(prefix="/api/skills", tags=["Skills"]) # create a router

# Create an endpoint GET /api/skills?q=<search term>
@router.get("", response_model=SkillSearchResponse)
def search_skills(q: str = Query(default=""), db: Session = Depends(get_db)):
    query = db.query(Skill).filter(Skill.status == "active")
    if q:
        query = query.filter(Skill.skill_name.ilike(f"%{q}%"))
    skills = query.limit(20).all()
    return SkillSearchResponse(skills=skills)


@router.post("", response_model=SkillResponse)
def create_skill(data: SkillCreate, db: Session = Depends(get_db)):
    existing = db.query(Skill).filter(
        Skill.skill_name.ilike(data.skill_name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Skill already exists")

    skill = Skill(
        skill_name=data.skill_name.strip(),
        skill_category=data.skill_category or "Custom"
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill

# Get all active skills
@router.get("/all", response_model=SkillSearchResponse)
def get_all_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).filter(Skill.status == "active").all()
    return SkillSearchResponse(skills=skills)

# Job-skill management (for seeding and later admin use)
@router.post("/jobs/{job_id}")
def add_skill_to_job(job_id: int, payload: dict, db: Session = Depends(get_db)):
    skill_id = payload.get("skill_id")
    if not skill_id:
        raise HTTPException(status_code=400, detail="skill_id required")
    # ensure job and skill exist
    job = db.query(JobPosting).filter(JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    existing = db.query(JobSkill).filter(
        JobSkill.job_id == job_id,
        JobSkill.skill_id == skill_id
    ).first()
    if existing:
        return {"message": "already attached"}
    js = JobSkill(job_id=job_id, skill_id=skill_id)
    db.add(js)
    db.commit()
    return {"message": "added"}

@router.delete("/jobs/{job_id}/{skill_id}")
def remove_skill_from_job(job_id: int, skill_id: str, db: Session = Depends(get_db)):
    js = db.query(JobSkill).filter(
        JobSkill.job_id == job_id,
        JobSkill.skill_id == skill_id
    ).first()
    if not js:
        raise HTTPException(status_code=404, detail="JobSkill not found")
    db.delete(js)
    db.commit()
    return {"message": "removed"}

# Get user's skills
@router.get("/user", response_model=UserSkillListResponse)
def get_user_skills(user=Depends(verify_jwt), db: Session = Depends(get_db)):
    user_id = user["sub"]
    user_skills = db.query(UserSkill).options(
        joinedload(UserSkill.skill)
    ).filter(UserSkill.user_id == user_id).all()

    # Convert to response format
    skill_responses = []
    for user_skill in user_skills:
        skill_responses.append(UserSkillResponse(
            id=user_skill.id,
            user_id=user_skill.user_id,
            skill_id=user_skill.skill_id,
            skill_name=user_skill.skill.skill_name if user_skill.skill else "",
            created_at=user_skill.created_at
        ))

    return UserSkillListResponse(user_skills=skill_responses)

# Add skill to user
@router.post("/user", response_model=UserSkillResponse)
def add_user_skill(
    skill_data: UserSkillCreate,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    # Check if skill exists
    skill = db.query(Skill).filter(Skill.id == skill_data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")

    # Check if user already has this skill
    existing = db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.skill_id == skill_data.skill_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has this skill")

    # Add the skill
    user_skill = UserSkill(
        user_id=user_id,
        skill_id=skill_data.skill_id
    )
    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    return UserSkillResponse(
        id=user_skill.id,
        user_id=user_skill.user_id,
        skill_id=user_skill.skill_id,
        skill_name=skill.skill_name,
        created_at=user_skill.created_at
    )

# Remove skill from user
@router.delete("/user/{skill_id}")
def remove_user_skill(
    skill_id: str,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db)
):
    user_id = user["sub"]

    user_skill = db.query(UserSkill).filter(
        UserSkill.user_id == user_id,
        UserSkill.skill_id == skill_id
    ).first()

    if not user_skill:
        raise HTTPException(status_code=404, detail="User skill not found")

    db.delete(user_skill)
    db.commit()

    return {"message": "Skill removed from user"}

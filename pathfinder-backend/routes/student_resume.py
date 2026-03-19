import uuid as uuid_mod
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from database import get_db
from models import StudentResume
from schemas import StudentResumeResponse
from jwt_auth import verify_jwt
from upload_images import _get_supabase

router = APIRouter(prefix="/api/student", tags=["Student Resume"])

RESUME_BUCKET = "resumes"


@router.post("/resume", response_model=StudentResumeResponse)
async def upload_resume(
    resume: UploadFile = File(...),
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]

    if resume.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Resume must be a PDF file")

    original_filename = resume.filename
    unique_filename = f"{uuid_mod.uuid4()}.pdf"
    contents = await resume.read()

    try:
        client = _get_supabase()
        client.storage.from_(RESUME_BUCKET).upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": "application/pdf"},
        )
        resume_url = client.storage.from_(RESUME_BUCKET).get_public_url(unique_filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload resume: {str(e)}")

    student_resume = StudentResume(
        student_user_id=user_id,
        resume_url=resume_url,
        resume_filename=original_filename,
    )
    db.add(student_resume)
    db.commit()
    db.refresh(student_resume)
    return student_resume


@router.get("/resume", response_model=StudentResumeResponse)
def get_current_resume(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    resume = (
        db.query(StudentResume)
        .filter(StudentResume.student_user_id == user_id)
        .order_by(StudentResume.uploaded_at.desc())
        .first()
    )
    if not resume:
        raise HTTPException(status_code=404, detail="No resume uploaded yet")
    return resume

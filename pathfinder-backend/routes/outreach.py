from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import EmailDraft, StartupContact, StudentResume
from schemas import EmailDraftGenerateRequest, EmailDraftResponse, EmailDraftUpdate
from jwt_auth import verify_jwt
from pdf_utils import extract_text_from_pdf_url
from gemini_service import generate_cold_email, moderate_email
import gmail_service

router = APIRouter(prefix="/api/outreach", tags=["Outreach"])


@router.post("/generate", response_model=list[EmailDraftResponse])
def generate_drafts(
    data: EmailDraftGenerateRequest,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]

    if len(data.startup_contact_ids) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 contacts per generation request")

    # Get the student's most recent resume
    resume = (
        db.query(StudentResume)
        .filter(StudentResume.student_user_id == user_id)
        .order_by(StudentResume.uploaded_at.desc())
        .first()
    )
    if not resume:
        raise HTTPException(status_code=400, detail="Please upload your resume first")

    # Extract text from PDF
    try:
        resume_text = extract_text_from_pdf_url(resume.resume_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read resume PDF: {str(e)}")

    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from resume. Please upload a text-based PDF.")

    # Fetch selected contacts
    contacts = (
        db.query(StartupContact)
        .filter(StartupContact.id.in_(data.startup_contact_ids))
        .all()
    )
    if not contacts:
        raise HTTPException(status_code=404, detail="No matching startup contacts found")

    drafts = []
    for contact in contacts:
        try:
            result = generate_cold_email(
                resume_text=resume_text,
                role_interest=data.role_interest,
                company_name=contact.company_name,
                contact_name=contact.contact_name,
                industry=contact.industry,
                website=contact.website,
            )
            draft = EmailDraft(
                student_user_id=user_id,
                startup_contact_id=contact.id,
                role_interest=data.role_interest,
                subject=result["subject"],
                body=result["body"],
                status="draft",
            )
            db.add(draft)
            drafts.append(draft)
        except Exception as e:
            # If one fails, continue with the rest
            print(f"Failed to generate draft for {contact.company_name}: {e}")

    db.commit()
    for d in drafts:
        db.refresh(d)

    return drafts


@router.get("/drafts", response_model=list[EmailDraftResponse])
def list_drafts(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    return (
        db.query(EmailDraft)
        .options(joinedload(EmailDraft.startup_contact))
        .filter(EmailDraft.student_user_id == user_id)
        .order_by(EmailDraft.created_at.desc())
        .all()
    )


@router.put("/drafts/{draft_id}", response_model=EmailDraftResponse)
def update_draft(
    draft_id: UUID,
    data: EmailDraftUpdate,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    draft = db.query(EmailDraft).filter(EmailDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.student_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your draft")
    if draft.status not in ("draft", "flagged"):
        raise HTTPException(status_code=400, detail="Can only edit drafts or flagged emails")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(draft, key, value)

    # Reset status to draft if it was flagged and user edited it
    if draft.status == "flagged":
        draft.status = "draft"
        draft.moderation_result = None

    db.commit()
    db.refresh(draft)
    return draft


@router.post("/drafts/{draft_id}/approve", response_model=EmailDraftResponse)
def approve_draft(
    draft_id: UUID,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    draft = (
        db.query(EmailDraft)
        .options(joinedload(EmailDraft.startup_contact))
        .filter(EmailDraft.id == draft_id)
        .first()
    )
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.student_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your draft")
    if draft.status not in ("draft",):
        raise HTTPException(status_code=400, detail=f"Cannot approve a draft with status '{draft.status}'")

    # Moderate with Gemini
    moderation = moderate_email(draft.subject, draft.body)
    if not moderation["approved"]:
        draft.status = "flagged"
        draft.moderation_result = moderation["reason"]
        db.commit()
        db.refresh(draft)
        raise HTTPException(
            status_code=422,
            detail=f"Email flagged by content moderation: {moderation['reason']}"
        )

    # Send via Gmail
    draft.status = "sending"
    db.commit()

    try:
        gmail_service.send_email(
            db=db,
            student_user_id=user_id,
            to_email=draft.startup_contact.email,
            subject=draft.subject,
            body=draft.body,
        )
        draft.status = "sent"
        draft.sent_at = datetime.now(timezone.utc)
    except Exception as e:
        draft.status = "failed"
        draft.moderation_result = str(e)

    db.commit()
    db.refresh(draft)
    return draft


@router.post("/drafts/approve-all", response_model=list[EmailDraftResponse])
def approve_all_drafts(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    drafts = (
        db.query(EmailDraft)
        .options(joinedload(EmailDraft.startup_contact))
        .filter(EmailDraft.student_user_id == user_id, EmailDraft.status == "draft")
        .all()
    )

    for draft in drafts:
        # Moderate
        moderation = moderate_email(draft.subject, draft.body)
        if not moderation["approved"]:
            draft.status = "flagged"
            draft.moderation_result = moderation["reason"]
            continue

        # Send
        draft.status = "sending"
        db.flush()
        try:
            gmail_service.send_email(
                db=db,
                student_user_id=user_id,
                to_email=draft.startup_contact.email,
                subject=draft.subject,
                body=draft.body,
            )
            draft.status = "sent"
            draft.sent_at = datetime.now(timezone.utc)
        except Exception as e:
            draft.status = "failed"
            draft.moderation_result = str(e)

    db.commit()
    return drafts


@router.delete("/drafts/{draft_id}")
def delete_draft(
    draft_id: UUID,
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    draft = db.query(EmailDraft).filter(EmailDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.student_user_id != user_id:
        raise HTTPException(status_code=403, detail="Not your draft")

    db.delete(draft)
    db.commit()
    return {"message": "Draft deleted"}

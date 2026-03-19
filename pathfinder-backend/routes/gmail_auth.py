import os
import logging
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from database import get_db
from models import GmailToken
from schemas import GmailStatusResponse
from jwt_auth import verify_jwt
import gmail_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gmail", tags=["Gmail OAuth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@router.get("/auth-url")
def get_auth_url(user=Depends(verify_jwt)):
    """Get Google OAuth consent URL. State encodes the student's user ID."""
    user_id = user["sub"]
    auth_url = gmail_service.get_auth_url(state=user_id)
    return {"url": auth_url}


@router.get("/callback/")
@router.get("/callback")
def gmail_callback(
    request: Request,
    db: Session = Depends(get_db),
):
    """OAuth callback from Google. Exchanges code for tokens and redirects to frontend."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")

    logger.info(f"Gmail callback hit. state={state}, code={'yes' if code else 'no'}")

    if not code or not state:
        logger.error(f"Missing code or state. Full URL: {request.url}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/student-dashboard?tab=outreach&gmail=error&reason=missing_params"
        )

    student_user_id = state

    try:
        tokens = gmail_service.exchange_code(code)
        gmail_service.save_tokens(db, student_user_id, tokens)
        logger.info(f"Gmail tokens saved for user {student_user_id}, email={tokens.get('email')}")
    except Exception as e:
        logger.error(f"Gmail callback error: {e}")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/student-dashboard?tab=outreach&gmail=error&reason={str(e)}"
        )

    return RedirectResponse(url=f"{FRONTEND_URL}/student-dashboard?tab=outreach&gmail=connected")


@router.get("/status", response_model=GmailStatusResponse)
def gmail_status(
    user=Depends(verify_jwt),
    db: Session = Depends(get_db),
):
    user_id = user["sub"]
    token = db.query(GmailToken).filter(GmailToken.student_user_id == user_id).first()
    return GmailStatusResponse(
        connected=token is not None,
        email=token.gmail_email if token else None,
    )

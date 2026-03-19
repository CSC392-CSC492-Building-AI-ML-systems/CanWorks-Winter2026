import os
import base64
from email.mime.text import MIMEText
from datetime import datetime, timezone

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from models import GmailToken

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/gmail/callback")

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
]

# Optional encryption for tokens at rest
_ENCRYPTION_KEY = os.getenv("TOKEN_ENCRYPTION_KEY")
_fernet = None
if _ENCRYPTION_KEY:
    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(_ENCRYPTION_KEY.encode() if isinstance(_ENCRYPTION_KEY, str) else _ENCRYPTION_KEY)
    except Exception:
        _fernet = None


def _client_config():
    return {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


def encrypt_token(token: str) -> str:
    if _fernet:
        return _fernet.encrypt(token.encode()).decode()
    return token


def decrypt_token(token: str) -> str:
    if _fernet:
        return _fernet.decrypt(token.encode()).decode()
    return token


def get_auth_url(state: str) -> str:
    """Generate Google OAuth consent URL without PKCE."""
    from urllib.parse import urlencode
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    """Exchange authorization code for tokens using direct HTTP request."""
    import httpx
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
    )
    token_response.raise_for_status()
    token_data = token_response.json()

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in")

    token_expiry = None
    if expires_in:
        from datetime import timedelta
        token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    # Fetch the user's email address
    email = None
    try:
        creds = Credentials(token=access_token)
        service = build("oauth2", "v2", credentials=creds)
        user_info = service.userinfo().get().execute()
        email = user_info.get("email")
    except Exception:
        pass

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": token_expiry,
        "email": email,
    }


def save_tokens(db: Session, student_user_id: str, tokens: dict):
    """Save or update Gmail OAuth tokens in DB."""
    existing = db.query(GmailToken).filter(GmailToken.student_user_id == student_user_id).first()
    if existing:
        existing.access_token = encrypt_token(tokens["access_token"])
        if tokens.get("refresh_token"):
            existing.refresh_token = encrypt_token(tokens["refresh_token"])
        existing.token_expiry = tokens.get("token_expiry")
        if tokens.get("email"):
            existing.gmail_email = tokens["email"]
        existing.updated_at = datetime.now(timezone.utc)
    else:
        gmail_token = GmailToken(
            student_user_id=student_user_id,
            gmail_email=tokens.get("email"),
            access_token=encrypt_token(tokens["access_token"]),
            refresh_token=encrypt_token(tokens.get("refresh_token", "")),
            token_expiry=tokens.get("token_expiry"),
        )
        db.add(gmail_token)
    db.commit()


def get_gmail_service(db: Session, student_user_id: str):
    """Build Gmail API service from stored tokens."""
    token_row = db.query(GmailToken).filter(GmailToken.student_user_id == student_user_id).first()
    if not token_row:
        return None

    creds = Credentials(
        token=decrypt_token(token_row.access_token),
        refresh_token=decrypt_token(token_row.refresh_token),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
    )

    if creds.expired and creds.refresh_token:
        from google.auth.transport.requests import Request
        creds.refresh(Request())
        token_row.access_token = encrypt_token(creds.token)
        token_row.token_expiry = creds.expiry
        db.commit()

    return build("gmail", "v1", credentials=creds)


def send_email(db: Session, student_user_id: str, to_email: str, subject: str, body: str) -> bool:
    """Send email via Gmail API. Returns True on success."""
    service = get_gmail_service(db, student_user_id)
    if not service:
        raise Exception("Gmail not connected. Please connect your Gmail account first.")

    message = MIMEText(body)
    message["to"] = to_email
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()

    service.users().messages().send(
        userId="me",
        body={"raw": raw},
    ).execute()
    return True

import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

_configured = False


def _ensure_configured():
    global _configured
    if not _configured:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not set in environment")
        genai.configure(api_key=api_key)
        _configured = True


def generate_cold_email(
    resume_text: str,
    role_interest: str,
    company_name: str,
    contact_name: str,
    industry: str | None,
    website: str | None,
) -> dict:
    """Generate a personalized cold email. Returns {"subject": "...", "body": "..."}."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""You are a career advisor helping a university student write a personalized cold email
to a startup company about a potential role.

STUDENT'S RESUME:
{resume_text}

DESIRED ROLE: {role_interest}

COMPANY INFO:
- Company: {company_name}
- Contact Person: {contact_name}
- Industry: {industry or 'N/A'}
- Website: {website or 'N/A'}

Write a professional, personalized cold email. Include:
1. A compelling subject line
2. A concise email body (3-4 paragraphs max)
3. Reference specific skills from the resume that match the role/industry
4. Show genuine interest in the company

Return your response in this exact format:
SUBJECT: <subject line>
BODY:
<email body>
"""

    response = model.generate_content(prompt)
    text = response.text

    subject = ""
    body = ""
    if "SUBJECT:" in text and "BODY:" in text:
        parts = text.split("BODY:", 1)
        subject = parts[0].replace("SUBJECT:", "").strip()
        body = parts[1].strip()
    else:
        subject = f"Interest in {role_interest} Role at {company_name}"
        body = text

    return {"subject": subject, "body": body}


def moderate_email(subject: str, body: str) -> dict:
    """Check email for inappropriate content. Returns {"approved": bool, "reason": str|None}."""
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""You are a content moderator reviewing a cold outreach email written by a university student seeking internship or job opportunities at a startup company. The current year is 2026.

Flag the email ONLY if it contains:
- Offensive, discriminatory, or harassing language
- Spam-like or clearly unprofessional content
- Anything that could damage the sender's or recipient's reputation

Do NOT flag for:
- Future dates (students commonly reference upcoming graduation dates, expected work terms, etc.)
- Mentioning skills, courses, or experiences — these are expected in student outreach
- Polite follow-up requests or expressions of interest

SUBJECT: {subject}
BODY: {body}

Respond with EXACTLY one of:
APPROVED
FLAGGED: <brief reason>
"""

    response = model.generate_content(prompt)
    result = response.text.strip()

    if result.startswith("APPROVED"):
        return {"approved": True, "reason": None}
    else:
        reason = result.replace("FLAGGED:", "").strip() if "FLAGGED:" in result else result
        return {"approved": False, "reason": reason}

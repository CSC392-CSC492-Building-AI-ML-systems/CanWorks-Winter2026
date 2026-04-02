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
    
    # Check if response was blocked by safety filters
    if not response.candidates or not response.candidates[0].content:
        return {"approved": False, "reason": "Content moderation failed - response blocked"}
    
    candidate = response.candidates[0]
    if hasattr(candidate, 'finish_reason') and candidate.finish_reason == 1:
        return {"approved": False, "reason": "Content moderation failed - response blocked"}
    
    result = response.text.strip()

    if result.startswith("APPROVED"):
        return {"approved": True, "reason": None}
    else:
        reason = result.replace("FLAGGED:", "").strip() if "FLAGGED:" in result else result
        return {"approved": False, "reason": reason}


def extract_job_skills(
    job_title: str,
    description: str,
    responsibilities: str = "",
    qualifications: str = "",
    existing_skills: list[str] = None,
) -> dict:
    """Use Gemini to extract skills from a job posting.
    
    Returns a dict with:
    - 'existing_skills': list of skills that match existing DB skills
    - 'new_skills': list of new skills that could be added to DB
    """
    _ensure_configured()
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    existing_skills_text = ""
    if existing_skills:
        existing_skills_text = "\nEXISTING SKILLS IN DATABASE:\n" + ", ".join(existing_skills)

    prompt = f"""You are a job intelligence assistant that extracts skills from job postings and matches them to existing skills in our database.

{existing_skills_text}

JOB TITLE:
{job_title}

JOB DESCRIPTION:
{description}

RESPONSIBILITIES:
{responsibilities}

QUALIFICATIONS:
{qualifications}

Your task is to extract skills from this job posting and categorize them into two lists:

1. EXISTING SKILLS: Skills that closely match skills already in our database (case-insensitive). Use the exact name from the database when possible.

2. NEW SKILLS: Skills that don't exist in our database or are significantly different variations.

Guidelines:
- For EXISTING SKILLS: Match to the closest existing skill. For example, if "Python" exists in DB, match "python programming" to "Python".
- For NEW SKILLS: Only include genuinely new skills, not minor variations.
- Focus on technical skills, programming languages, frameworks, tools, and technologies.
- Return maximum 10 skills total across both lists.

Return your response in this exact format:
EXISTING SKILLS: skill1, skill2, skill3
NEW SKILLS: skill4, skill5, skill6"""

    response = model.generate_content(prompt)
    text = response.text.strip()
    
    # Parse the response
    existing_skills_list = []
    new_skills_list = []
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('EXISTING SKILLS:'):
            skills_text = line.replace('EXISTING SKILLS:', '').strip()
            if skills_text:
                existing_skills_list = [s.strip() for s in skills_text.split(',') if s.strip()]
        elif line.startswith('NEW SKILLS:'):
            skills_text = line.replace('NEW SKILLS:', '').strip()
            if skills_text:
                new_skills_list = [s.strip() for s in skills_text.split(',') if s.strip()]
    
    print(f"Extracted for '{job_title}': existing={existing_skills_list}, new={new_skills_list}")
    
    return {
        "existing_skills": existing_skills_list,
        "new_skills": new_skills_list
    }

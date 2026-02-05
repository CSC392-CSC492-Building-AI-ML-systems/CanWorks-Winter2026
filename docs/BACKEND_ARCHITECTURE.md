# Plan: Backend Architecture for CanWorks PATHFINDER

## Overview

This document outlines the backend architecture using **Python FastAPI** for the CanWorks PATHFINDER job aggregation platform, with **Next.js** handling the frontend.

---

## Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16 (React) | Already configured, excellent UI framework |
| **Backend API** | Python FastAPI | Fast, async, great typing support, OpenAPI docs |
| **Database** | PostgreSQL + SQLAlchemy | Robust relational DB with Python's best ORM |
| **Migrations** | Alembic | Database migration tool for SQLAlchemy |
| **Auth** | FastAPI-Users + PyOTP | JWT auth with TOTP MFA support |
| **Background Jobs** | Celery + Redis | Industry standard for Python task queues |
| **Scraping** | Scrapy + BeautifulSoup | Python's best scraping tools |
| **Email** | FastAPI-Mail | Simple async email sending |
| **Validation** | Pydantic v2 | Data validation and serialization |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS FRONTEND (React)                         │
│                    http://localhost:3000                            │
├─────────────────────────────────────────────────────────────────────┤
│  • Job Search UI          • User Dashboard                          │
│  • Admin Panel            • Employer Portal                         │
│  • Authentication Pages   • Job Alerts Management                   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/REST API calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Python)                         │
│                    http://localhost:8000                            │
├─────────────────────────────────────────────────────────────────────┤
│  /api/v1/                                                           │
│  ├── /auth/*          (login, register, MFA, password reset)       │
│  ├── /jobs/*          (CRUD, search, filters)                      │
│  ├── /users/*         (profiles, saved jobs, alerts)               │
│  ├── /employers/*     (employer portal)                            │
│  ├── /admin/*         (sources, reference tables, reports)         │
│  └── /analytics/*     (click tracking, reports)                    │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   Redis         │  │   Celery        │
│   Database      │  │   Cache/Queue   │  │   Workers       │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ • Jobs          │  │ • Session store │  │ • Scrapers      │
│ • Users         │  │ • Rate limiting │  │ • Link checker  │
│ • Employers     │  │ • Task queue    │  │ • Email alerts  │
│ • Audit logs    │  │ • Caching       │  │ • Data cleanup  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Project Structure

```
CSC398-Group14-Pathfinder/
├── path-finder/                    # Next.js Frontend
│   ├── app/
│   │   ├── (auth)/                 # Login, Register, MFA pages
│   │   ├── (dashboard)/            # Protected user pages
│   │   ├── (admin)/                # Admin panel
│   │   ├── jobs/                   # Job listing pages
│   │   └── api/                    # Minimal - just auth proxy if needed
│   ├── lib/
│   │   └── api-client.ts           # Typed API client for FastAPI
│   └── ...
│
├── pathfinder-backend/                        # Python FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entry point
│   │   ├── config.py               # Settings and env vars
│   │   ├── database.py             # SQLAlchemy setup
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py             # Dependency injection (auth, db)
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── router.py       # Main API router
│   │   │       ├── auth.py         # Auth endpoints
│   │   │       ├── jobs.py         # Job endpoints
│   │   │       ├── users.py        # User endpoints
│   │   │       ├── employers.py    # Employer endpoints
│   │   │       ├── admin.py        # Admin endpoints
│   │   │       └── analytics.py    # Analytics endpoints
│   │   │
│   │   ├── models/                 # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── employer.py
│   │   │   ├── reference.py        # Province, Major, Skill, etc.
│   │   │   └── audit.py            # AccessLog, ScrapeLog
│   │   │
│   │   ├── schemas/                # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── job.py
│   │   │   ├── employer.py
│   │   │   └── common.py
│   │   │
│   │   ├── services/               # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py     # Auth + MFA logic
│   │   │   ├── job_service.py      # Job CRUD + search
│   │   │   ├── deduplication.py    # Hash-based dedup
│   │   │   ├── classification.py   # Auto-tagging
│   │   │   ├── email_service.py    # Send alerts
│   │   │   └── audit_service.py    # Logging access
│   │   │
│   │   ├── scrapers/               # Web scrapers
│   │   │   ├── __init__.py
│   │   │   ├── base.py             # Abstract scraper class
│   │   │   ├── civic_jobs.py
│   │   │   ├── career_edge.py
│   │   │   ├── work_in_nonprofit.py
│   │   │   ├── eco_canada.py
│   │   │   └── mars_discovery.py
│   │   │
│   │   └── tasks/                  # Celery tasks
│   │       ├── __init__.py
│   │       ├── celery_app.py       # Celery configuration
│   │       ├── scrape_tasks.py     # Scheduled scraping
│   │       ├── link_validator.py   # Daily 404 checks
│   │       └── alert_tasks.py      # Email notifications
│   │
│   ├── alembic/                    # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   │
│   ├── tests/                      # pytest tests
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_jobs.py
│   │   └── ...
│   │
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── pyproject.toml
```

---

## Database Schema

**UserRole**
- `student` - Current postsecondary students
- `graduate` - Recent graduates (within 2 years)
- `employer` - Companies posting jobs
- `admin` - Manages data sources and reference tables
- `superuser` - Analytics and reporting access

**JobType**
- `coop` - Work-integrated learning requiring academic enrollment
- `internship` - Short-term positions
- `new_grad` - Entry-level roles (0-2 years experience)

**JobTerm**
- `summer`, `fall`, `winter`, `year_round`

**LocationType**
- `remote`, `hybrid`, `onsite`

---

### User Table

- **id** - Primary key (CUID)
- **email** - Unique, indexed, required
- **password_hash** - Hashed password, required
- **role** - UserRole enum, required
- **mfa_secret** - TOTP secret for MFA (nullable)
- **mfa_enabled** - Boolean, default false
- **consent_given** - Boolean, default false
- **consent_date** - DateTime when consent was given
- **consent_withdrawn** - DateTime when consent was withdrawn
- **created_at** - Timestamp
- **updated_at** - Timestamp (auto-updates)

**Relationships:**
- Has one `UserProfile`
- Has many `SavedJob`
- Has many `JobAlert`

---

### Job Table

- **id** - Primary key (CUID)
- **title** - String, indexed, required
- **company_name** - String, indexed, required
- **job_type** - JobType enum, required
- **term** - JobTerm enum (nullable)
- **location_type** - LocationType enum, required
- **city** - String (nullable)
- **province_id** - Foreign key to provinces table
- **description** - Full job description text, required
- **description_highlights** - AI-generated summary (nullable)
- **with_pay** - Boolean, default true
- **application_deadline** - DateTime (nullable)
- **academic_credit_required** - Boolean, default false
- **minimum_gpa** - Float (nullable)
- **required_majors** - Array of strings
- **required_skills** - Array of strings
- **source_id** - Foreign key to data_sources, required
- **original_url** - Source URL, required
- **date_posted** - DateTime (nullable)
- **last_scraped_at** - DateTime, required
- **dedupe_hash** - SHA256 hash of (company + title + location), unique, indexed
- **is_active** - Boolean, indexed, default true
- **update_prohibited** - Boolean, default false
- **archived_at** - DateTime (nullable)
- **archive_reason** - String (nullable)
- **employer_notes** - Text (nullable)
- **created_at** - Timestamp
- **updated_at** - Timestamp (auto-updates)

**Relationships:**
- Belongs to `DataSource`
- Belongs to `Province`
- Has many `SavedJob`
- Has many `JobClick`

---

### DataSource Table

- **id** - Primary key (CUID)
- **name** - Unique, required (e.g., "CivicJobs.ca")
- **source_type** - String: 'scraper', 'manual', or 'employer'
- **base_url** - Base URL for scraping (nullable)
- **crawl_delay_seconds** - Integer, default 5
- **disallowed_paths** - Array of paths to avoid
- **contact_first_name** - String (nullable)
- **contact_last_name** - String (nullable)
- **contact_email** - String (nullable)
- **contact_phone** - String (nullable)
- **preferred_contact** - String (nullable)
- **available_for_events** - Boolean, default false
- **is_sponsor** - Boolean, default false
- **canworks_hires** - Integer count, default 0
- **employee_count** - String range (nullable)
- **update_prohibited** - Boolean, default false
- **feed_method** - String (nullable)
- **employer_user_id** - Foreign key to users (nullable)
- **special_notes** - Text (nullable)

**Relationships:**
- Has many `Job`
- Has many `ScrapeLog`
- Optionally belongs to `User` (employer account)

---

## Example Implementation Details

### 1. FastAPI Application Setup

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.config import settings

app = FastAPI(
    title="CanWorks PATHFINDER API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### 2. Authentication with MFA

```python
# backend/app/services/auth_service.py
import pyotp
from passlib.hash import bcrypt
from jose import jwt
from datetime import datetime, timedelta

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, email: str, password: str, role: UserRole) -> User:
        user = User(
            email=email,
            password_hash=bcrypt.hash(password),
            role=role,
        )
        self.db.add(user)
        self.db.commit()
        return user

    def verify_password(self, user: User, password: str) -> bool:
        return bcrypt.verify(password, user.password_hash)

    def setup_mfa(self, user: User) -> str:
        """Generate MFA secret and return provisioning URI for QR code"""
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        self.db.commit()

        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(user.email, issuer_name="CanWorks PATHFINDER")

    def verify_mfa(self, user: User, code: str) -> bool:
        if not user.mfa_secret:
            return False
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code)

    def enable_mfa(self, user: User, code: str) -> bool:
        """Verify code and enable MFA"""
        if self.verify_mfa(user, code):
            user.mfa_enabled = True
            self.db.commit()
            return True
        return False

    def create_access_token(self, user: User) -> str:
        expire = datetime.utcnow() + timedelta(hours=24)
        payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role.value,
            "exp": expire,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
```

### 3. Deduplication Service

```python
# backend/app/services/deduplication.py
import hashlib

def generate_dedupe_hash(company_name: str, title: str, location: str) -> str:
    """Generate unique hash for job deduplication"""
    normalized = f"{company_name.lower().strip()}|{title.lower().strip()}|{location.lower().strip()}"
    return hashlib.sha256(normalized.encode()).hexdigest()

async def find_or_create_job(db: Session, job_data: JobCreate) -> tuple[Job, bool]:
    """
    Find existing job by dedupe hash or create new one.
    Returns (job, is_new)
    """
    location = job_data.city or job_data.province_id or "remote"
    dedupe_hash = generate_dedupe_hash(
        job_data.company_name,
        job_data.title,
        location
    )

    existing = db.query(Job).filter(Job.dedupe_hash == dedupe_hash).first()

    if existing:
        # Update last_scraped_at timestamp
        existing.last_scraped_at = datetime.utcnow()
        db.commit()
        return existing, False

    # Create new job
    new_job = Job(**job_data.dict(), dedupe_hash=dedupe_hash)
    db.add(new_job)
    db.commit()
    return new_job, True
```

### 4. Auto-Classification Service

```python
# backend/app/services/classification.py
import re

COOP_KEYWORDS = [
    r"\bco-?op\b",
    r"\bwork term\b",
    r"\bacademic credit\b",
    r"\benrollment required\b",
    r"\bwork.?integrated learning\b",
]

INTERNSHIP_KEYWORDS = [
    r"\bintern(ship)?\b",
    r"\bsummer student\b",
    r"\bwork placement\b",
]

NEW_GRAD_KEYWORDS = [
    r"\bnew grad(uate)?\b",
    r"\bentry.?level\b",
    r"\bjunior\b",
    r"\b0-?2 years?\b",
    r"\brecent graduate\b",
]

def classify_job(title: str, description: str) -> JobType:
    """Auto-classify job based on title and description keywords"""
    text = f"{title} {description}".lower()

    # Check Co-op first (most specific)
    for pattern in COOP_KEYWORDS:
        if re.search(pattern, text, re.IGNORECASE):
            return JobType.COOP

    # Then Internship
    for pattern in INTERNSHIP_KEYWORDS:
        if re.search(pattern, text, re.IGNORECASE):
            return JobType.INTERNSHIP

    # Default to New Grad
    return JobType.NEW_GRAD


def detect_academic_credit(description: str) -> bool:
    """Check if job requires academic credit/enrollment"""
    patterns = [
        r"enrollment required",
        r"academic credit",
        r"for credit only",
        r"must be enrolled",
        r"current(ly)? enrolled student",
        r"registered in.+program",
    ]
    for pattern in patterns:
        if re.search(pattern, description, re.IGNORECASE):
            return True
    return False


def detect_remote_canada(description: str) -> bool:
    """Check if remote job is Canada-specific"""
    canada_patterns = [
        r"remote.+canada",
        r"canada.+remote",
        r"canadian (resident|citizen)",
        r"must (be|reside).+canada",
        r"canadian tax",
    ]
    for pattern in canada_patterns:
        if re.search(pattern, description, re.IGNORECASE):
            return True
    return False
```

### 5. Base Scraper Class

```python
# backend/app/scrapers/base.py
from abc import ABC, abstractmethod
import asyncio
import httpx
from bs4 import BeautifulSoup
from datetime import datetime
from app.models.employer import DataSource
from app.models.audit import ScrapeLog

class BaseScraper(ABC):
    def __init__(self, db: Session, source: DataSource):
        self.db = db
        self.source = source
        self.crawl_delay = source.crawl_delay_seconds

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    async def fetch_page(self, url: str) -> str:
        """Fetch page with rate limiting"""
        await asyncio.sleep(self.crawl_delay)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            return response.text

    def parse_html(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, "html.parser")

    @abstractmethod
    async def scrape(self) -> list[dict]:
        """
        Scrape jobs from source.
        Returns list of job dictionaries.
        """
        pass

    async def run(self) -> ScrapeLog:
        """Execute scraper and log results"""
        log = ScrapeLog(
            source_id=self.source.id,
            status="running",
            started_at=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.commit()

        try:
            jobs = await self.scrape()
            jobs_added = 0
            jobs_updated = 0

            for job_data in jobs:
                job, is_new = await find_or_create_job(self.db, job_data)
                if is_new:
                    jobs_added += 1
                else:
                    jobs_updated += 1

            log.status = "success"
            log.jobs_found = len(jobs)
            log.jobs_added = jobs_added
            log.jobs_updated = jobs_updated
            log.completed_at = datetime.utcnow()

        except Exception as e:
            log.status = "failed"
            log.error_message = str(e)
            log.completed_at = datetime.utcnow()

        self.db.commit()
        return log


# backend/app/scrapers/civic_jobs.py
class CivicJobsScraper(BaseScraper):
    source_name = "CivicJobs.ca"

    async def scrape(self) -> list[dict]:
        jobs = []
        # 5-second crawl delay per robots.txt
        html = await self.fetch_page("https://civicjobs.ca/jobs")
        soup = self.parse_html(html)

        for listing in soup.select(".job-listing"):
            title = listing.select_one(".job-title").text.strip()
            company = listing.select_one(".company-name").text.strip()
            # ... extract other fields

            job_type = classify_job(title, description)
            academic_credit = detect_academic_credit(description)

            jobs.append({
                "title": title,
                "company_name": company,
                "job_type": job_type,
                "academic_credit_required": academic_credit,
                "source_id": self.source.id,
                "original_url": job_url,
                "last_scraped_at": datetime.utcnow(),
                # ... other fields
            })

        return jobs
```

### 6. Celery Tasks

```python
# backend/app/tasks/celery_app.py
from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "pathfinder",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.beat_schedule = {
    # Scrape each source on different schedules
    "scrape-civic-jobs": {
        "task": "app.tasks.scrape_tasks.scrape_civic_jobs",
        "schedule": crontab(hour="*/4"),  # Every 4 hours
    },
    "scrape-career-edge": {
        "task": "app.tasks.scrape_tasks.scrape_career_edge",
        "schedule": crontab(hour="*/6"),  # Every 6 hours
    },
    "scrape-eco-canada": {
        "task": "app.tasks.scrape_tasks.scrape_eco_canada",
        "schedule": crontab(hour="*/4"),  # Every 4 hours (15s delay)
    },
    # Daily link validation at 2 AM
    "validate-links": {
        "task": "app.tasks.link_validator.validate_all_links",
        "schedule": crontab(hour=2, minute=0),
    },
    # Process job alerts
    "send-daily-alerts": {
        "task": "app.tasks.alert_tasks.send_daily_alerts",
        "schedule": crontab(hour=8, minute=0),  # 8 AM daily
    },
}


# backend/app/tasks/scrape_tasks.py
from app.tasks.celery_app import celery_app
from app.scrapers.civic_jobs import CivicJobsScraper
from app.database import SessionLocal

@celery_app.task
def scrape_civic_jobs():
    db = SessionLocal()
    try:
        source = db.query(DataSource).filter_by(name="CivicJobs.ca").first()
        scraper = CivicJobsScraper(db, source)
        asyncio.run(scraper.run())
    finally:
        db.close()


# backend/app/tasks/link_validator.py
@celery_app.task
def validate_all_links():
    """Check all active job URLs for 404s"""
    db = SessionLocal()
    try:
        jobs = db.query(Job).filter(Job.is_active == True).all()
        broken_count = 0

        for job in jobs:
            try:
                response = httpx.head(job.original_url, timeout=10)
                if response.status_code in [404, 410, 500, 502, 503]:
                    job.is_active = False
                    job.archived_at = datetime.utcnow()
                    job.archive_reason = f"HTTP {response.status_code}"
                    broken_count += 1
            except httpx.RequestError:
                job.is_active = False
                job.archived_at = datetime.utcnow()
                job.archive_reason = "Connection failed"
                broken_count += 1

        db.commit()
        return {"checked": len(jobs), "broken": broken_count}
    finally:
        db.close()
```

### 7. Role-Based Access Control

```python
# backend/app/api/deps.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError

security = HTTPBearer()

async def get_current_user(
    token: str = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_role(*roles: UserRole):
    """Dependency to require specific user roles"""
    async def role_checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Requires one of: {[r.value for r in roles]}"
            )
        return user
    return role_checker


# Usage in endpoints:
@router.get("/admin/sources")
async def list_sources(
    user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPERUSER)),
    db: Session = Depends(get_db)
):
    return db.query(DataSource).all()
```

---

## API Endpoints Summary

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `POST /api/v1/auth/register` | POST | Create account | No |
| `POST /api/v1/auth/login` | POST | Login (email + password) | No |
| `POST /api/v1/auth/mfa/setup` | POST | Get MFA QR code | Yes |
| `POST /api/v1/auth/mfa/verify` | POST | Verify MFA code | Yes |
| `POST /api/v1/auth/mfa/enable` | POST | Enable MFA on account | Yes |
| `GET /api/v1/jobs` | GET | List jobs with filters | No |
| `GET /api/v1/jobs/{id}` | GET | Get job details | No |
| `POST /api/v1/jobs/search` | POST | Advanced search | No |
| `POST /api/v1/jobs` | POST | Create job | Admin/Employer |
| `GET /api/v1/users/me` | GET | Get current profile | Yes |
| `PATCH /api/v1/users/me` | PATCH | Update profile | Yes |
| `GET /api/v1/users/me/saved-jobs` | GET | List saved jobs | Yes |
| `POST /api/v1/users/me/saved-jobs/{job_id}` | POST | Save a job | Yes |
| `DELETE /api/v1/users/me/saved-jobs/{job_id}` | DELETE | Unsave a job | Yes |
| `GET /api/v1/users/me/alerts` | GET | List job alerts | Yes |
| `POST /api/v1/users/me/alerts` | POST | Create job alert | Yes |
| `GET /api/v1/admin/sources` | GET | List data sources | Admin |
| `POST /api/v1/admin/sources` | POST | Add data source | Admin |
| `GET /api/v1/admin/reports/links` | GET | Dead link report | Admin |
| `GET /api/v1/admin/reference/{table}` | GET | Get reference table | Admin |
| `POST /api/v1/analytics/clicks` | POST | Track outbound click | No |
| `GET /api/v1/analytics/reports` | GET | Engagement reports | Superuser |

---

## Implementation Phases

### Phase 1: Foundation (Backend Setup)
- [ ] Create `backend/` directory structure
- [ ] Set up FastAPI with SQLAlchemy and Alembic
- [ ] Create database models
- [ ] Run initial migrations
- [ ] Set up Docker Compose for local dev

### Phase 2: Authentication
- [ ] Implement registration and login endpoints
- [ ] Add JWT token generation
- [ ] Implement MFA setup and verification
- [ ] Add role-based access control middleware

### Phase 3: Core API
- [ ] Job CRUD endpoints
- [ ] Search with filters (type, location, keywords)
- [ ] User profile management
- [ ] Saved jobs functionality

### Phase 4: Scraping Infrastructure
- [ ] Implement BaseScraper class
- [ ] Build scrapers for all 5 sources
- [ ] Add deduplication and classification
- [ ] Set up Celery with scheduled tasks

### Phase 5: Admin Features
- [ ] Data source management endpoints
- [ ] Reference table CRUD
- [ ] Scrape log viewing
- [ ] Dead link reports

### Phase 6: Notifications & Analytics
- [ ] Job alert system
- [ ] Email integration
- [ ] Click tracking
- [ ] Analytics dashboard endpoints

### Phase 7: Frontend Integration
- [ ] Create API client in Next.js
- [ ] Connect auth flow to backend
- [ ] Build job search UI
- [ ] Implement user dashboard

---

## Verification Plan

1. **Database**: Run `alembic upgrade head` and verify tables created
2. **API Docs**: Visit `http://localhost:8000/api/docs` for interactive Swagger UI
3. **Auth Flow**: Test register → login → MFA setup → MFA verify
4. **Scrapers**: Run individual scrapers manually, check data in DB
5. **Celery**: Check worker logs for scheduled task execution
6. **Search**: Test various filter combinations via API
7. **Frontend**: Verify Next.js can call all API endpoints

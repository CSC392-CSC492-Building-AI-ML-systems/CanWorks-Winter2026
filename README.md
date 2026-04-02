# CanWorks Pathfinder

A full-stack job matching platform that connects Canadian students with hidden opportunities at startups and small businesses. Built for [CanWorks](https://canworks.ca), a workforce development non-profit.

Pathfinder goes beyond traditional job boards by offering AI-powered job recommendations using sentence embeddings, a cold email outreach feature powered by Google Gemini, and a streamlined employer job posting wizard with built-in templates.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS, Material-UI v7, Lucide icons, Recharts |
| Backend | FastAPI (Python 3.11), Uvicorn |
| Database | PostgreSQL + pgvector (via Supabase) |
| Auth | Supabase Auth (JWT with JWKS verification) |
| Storage | Supabase Storage (resume PDFs, article images) |
| AI/ML | FastEmbed (all-MiniLM-L6-v2, 384-dim), Google Gemini 2.5 Flash |
| Email | Gmail API (OAuth 2.0) with Fernet token encryption |
| Deployment | Google Cloud Run, Cloud Build, Artifact Registry |

---

## Features

### Student Dashboard
- **Job Discovery** -- Browse, search, and filter job postings with client-side pagination (10 per page, most recent first)
- **AI-Powered Recommendations** -- Content-based job recommendations using sentence embeddings and cosine similarity, with skill-boost scoring and cold-start fallback
- **Save Jobs** -- Bookmark jobs with real-time UI updates; notifications when saved jobs are removed by admin
- **In-Platform Applications** -- Apply to employer-posted jobs with resume upload; track application status (Pending, Reviewing, Interview, Offer, Rejected, Hired, Job Removed by Admin)
- **Cold Email Outreach** -- 6-step AI pipeline: upload resume, select startup contacts, Gemini generates personalized emails, student reviews/edits drafts, content moderation, Gmail API sends with resume attached
- **Career Insights** -- Read career advice articles with inline content or external article links

### Employer Dashboard
- **6-Step Job Posting Wizard** -- Guided job creation: Job Basics, Description, Responsibilities, Skills (autocomplete search), Compensation, and Review
- **Template System** -- Searchable template library filtered by industry, title, or seniority; pre-fills the entire wizard
- **Draft-First Design** -- Save at every step; drafts persist across sessions
- **Job Lifecycle Management** -- Create, publish, unpublish, duplicate, and soft-delete jobs across Drafts, Active, and History tabs
- **Application Pipeline** -- Review applications, update status, track hiring metrics (time to hire, offer acceptance rate, applications per position)
- **Employer Analytics** -- Hiring metrics, top skills, top universities, job status breakdown

### Admin Dashboard
- **Reports** -- Platform-wide analytics: KPI cards, application pipeline, jobs by type/province (Recharts), top skills, returning visitor rate, engagement metrics
- **Job Management** -- Browse all jobs with pagination, search, and source filter (Admin/Employer); delete jobs with cascading application status updates
- **Employer Management** -- View all employer accounts with company info, contact details, event/sponsor badges
- **Career Insights Management** -- CRUD for career advice articles with featured image uploads to Supabase Storage
- **Startup Contacts** -- Manage the contact database used by the student outreach feature
- **Bulk Job Upload** -- Excel ingestion with SHA256 deduplication, skill normalization, inline embedding generation, and feed logging

---

## Project Structure

```
CanWorks-Winter2026/
├── pathfinder-backend/
│   ├── main.py                 # FastAPI entry point, route registration
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── database.py             # DB engine and session factory
│   ├── auth.py                 # Admin auth (get_current_user)
│   ├── jwt_auth.py             # Student/employer auth (verify_jwt)
│   ├── excel_parser.py         # Excel job file parser
│   ├── compute_embeddings.py   # Batch embedding generation
│   ├── gemini_service.py       # Gemini email generation + moderation
│   ├── gmail_service.py        # Gmail OAuth + email sending
│   ├── pdf_utils.py            # Resume PDF text extraction
│   ├── upload_images.py        # Supabase Storage uploads
│   ├── seed.py                 # Seeds skills + templates tables
│   ├── routes/
│   │   ├── job_descriptions.py # Employer job CRUD + publish validation
│   │   ├── applications.py     # Student applications + employer review
│   │   ├── analytics.py        # Admin + employer analytics
│   │   ├── templates.py        # Job templates (read-only)
│   │   ├── skills.py           # Skill search + creation
│   │   ├── startup_contacts.py # Admin CRUD for outreach contacts
│   │   ├── student_resume.py   # Resume upload
│   │   ├── outreach.py         # Email draft generation + approval
│   │   └── gmail_auth.py       # Gmail OAuth flow
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   └── requirements.txt
│
├── pathfinder-frontend/
│   ├── src/app/
│   │   ├── student-dashboard/  # Home, Explore, Applications, Outreach, etc.
│   │   ├── employer-dashboard/ # Wizard, Drafts, Active, History, Analytics
│   │   ├── admin-dashboard/    # Reports, Jobs, Employers, Insights, Contacts
│   │   ├── components/         # Shared: JobCard, JobDetailsSidebar, Header, Auth
│   │   ├── hooks/              # useSavedJobs
│   │   └── lib/                # Supabase client
│   ├── src/types/index.ts      # All TypeScript interfaces
│   ├── src/axiosConfig/        # Axios instance with JWT interceptor
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Supabase project (free tier works)
- A Google Cloud project (for Gmail OAuth + Gemini API)

### 1. Clone the repository

```bash
git clone https://github.com/CSC392-CSC492-Building-AI-ML-systems/CanWorks-Winter2026.git
cd CanWorks-Winter2026
```

### 2. Set up environment variables

Follow `ENV_SETUP_GUIDE.md` for detailed instructions on creating all API keys. You'll need:

**Backend** (`pathfinder-backend/.env`):
```
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-1-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_JWT_SECRET=<your-jwt-secret>
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:8000/api/gmail/callback
TOKEN_ENCRYPTION_KEY=<your-fernet-key>
GEMINI_API_KEY=<your-gemini-key>
```

**Frontend** (`pathfinder-frontend/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Enable pgvector

In your Supabase SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Create Supabase Storage buckets

Create two public buckets in your Supabase dashboard:
- `resumes` -- for student resume PDFs
- `career-insights-bucket` -- for career insight featured images

### 5. Start the backend

```bash
cd pathfinder-backend
pip install -r requirements.txt
python seed.py          # Seeds skills and templates (first run only)
uvicorn main:app --reload --port 8000
```

### 6. Start the frontend

```bash
cd pathfinder-frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and the backend at `http://localhost:8000`.

### 7. Create an admin account

Admin accounts can only be created via the Supabase dashboard:

1. Go to **Authentication > Users > Add User**
2. Enter email and password
3. Edit the user's `raw_user_meta_data`:
```json
{
  "userData": {
    "userType": "admin"
  }
}
```

---

## Architecture

```
┌──────────────────┐       ┌──────────────────────────┐
│  Next.js 16      │       │  FastAPI Backend         │
│  (Cloud Run)     │──────>│  (Cloud Run)             │
│                  │  JWT  │                          │
│  React 19 + TS   │<──────│  Uvicorn ASGI Server     │
│  Tailwind + MUI  │       │                          │
└──────────────────┘       │  Recommendation Engine   │
        │                  │  - FastEmbed (384-dim)   │
        │                  │  - Cosine Similarity     │
        v                  │  - Skill Boost Scoring   │
┌──────────────────┐       │                          │
│  Supabase        │       │  Email Outreach Engine   │
│  - Auth (JWT)    │       │  - Gemini AI Drafts      │
│  - Storage (PDF) │<──────│  - Gmail OAuth Send      │
│  - PostgreSQL    │       │  - Content Moderation    │
│    + pgvector    │       └──────────────────────────┘
└──────────────────┘
```

### Key Design Decisions

- **Supabase as unified backend** -- Auth, database, and storage in one platform, avoiding microservice complexity
- **pgvector over dedicated vector DB** -- Native vector similarity in the same PostgreSQL instance; sufficient at our scale
- **FastEmbed over sentence-transformers** -- ONNX-optimized inference without PyTorch, reducing Docker image size from ~2GB to ~200MB and Cloud Run cold starts from ~30s to ~8s
- **Gmail API over SMTP** -- Emails sent from the student's own Gmail land in inboxes (not spam), appear in their Sent folder, and show a real person to recipients
- **Draft-first job posting** -- Employers can save at every wizard step; no work is lost if they leave mid-creation
- **Content moderation at send time** -- Catches edited content, not just AI output
- **Soft deletes** -- Jobs are never hard-deleted; cascading status updates notify students when their saved/applied jobs are removed

### Recommendation Algorithm

1. Extract user preferences (employment type) from JWT for candidate pre-filtering
2. Collect embeddings from saved jobs (weight: 1.0) and recent views (weight: 0.2)
3. Compute weighted average to create user embedding (384-dim)
4. Score candidates via cosine similarity + skill overlap boost
5. Cold-start fallback: recent jobs filtered by employment type preference

---

## Deployment

Both services deploy to Google Cloud Run via Cloud Build.

### Backend

```bash
cd pathfinder-backend
gcloud builds submit --config=cloudbuild.yaml
gcloud run deploy canworks-backend \
  --image us-central1-docker.pkg.dev/$(gcloud config get-value project)/cloud-run-source-deploy/canworks-backend \
  --region us-central1
```

### Frontend

```bash
cd pathfinder-frontend
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions="_NEXT_PUBLIC_API_URL=https://your-backend-url,_NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co,_NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key,_NEXT_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
gcloud run deploy canworks-pathfinder \
  --image us-central1-docker.pkg.dev/$(gcloud config get-value project)/cloud-run-source-deploy/canworks-frontend \
  --region us-central1
```

---

## API Overview

| Category | Endpoint | Method | Description |
|----------|----------|--------|-------------|
| Jobs | `/api/jobs` | GET | List published jobs (paginated, filterable) |
| Jobs | `/api/upload-jobs` | POST | Admin bulk upload from Excel |
| Jobs | `/api/recommendations` | GET | AI-powered job recommendations |
| Jobs | `/api/saved-jobs` | GET/POST/DELETE | Save/unsave jobs |
| Jobs | `/api/admin/jobs/{id}` | DELETE | Admin soft-delete job |
| Employer | `/api/job-descriptions` | GET/POST/PUT/DELETE | Employer job CRUD |
| Employer | `/api/job-descriptions/{id}/publish` | POST | Publish with validation |
| Applications | `/api/applications` | POST/GET | Apply to jobs, list applications |
| Applications | `/api/applications/{id}/status` | PUT | Employer updates status |
| Outreach | `/api/outreach/generate` | POST | Generate AI email drafts |
| Outreach | `/api/outreach/drafts/{id}/approve` | POST | Send email via Gmail |
| Gmail | `/api/gmail/auth-url` | GET | Get OAuth consent URL |
| Gmail | `/api/gmail/callback` | GET | Handle OAuth redirect |
| Templates | `/api/templates` | GET | List job templates |
| Skills | `/api/skills` | GET/POST | Search/create skills |
| Analytics | `/api/admin/analytics` | GET | Platform-wide metrics |
| Analytics | `/api/employer/analytics` | GET | Employer hiring metrics |
| Admin | `/api/admin/employers` | GET | List employer accounts |
| Content | `/api/career-insights` | GET/POST/PUT/DELETE | Career article CRUD |
| Contacts | `/api/admin/startup-contacts` | GET/POST/PUT/DELETE | Outreach contacts CRUD |

---

## Database Schema

Core tables (PostgreSQL + pgvector):

- **jobs** -- Unified job table (admin-uploaded + employer-created) with 384-dim vector embeddings
- **job_skills** -- Junction table linking jobs to skills (required/preferred)
- **skills** -- Master skill list (pre-seeded + user-created)
- **templates** -- Pre-built job description templates
- **applications** -- Student job applications with status pipeline
- **saved_jobs** -- Student bookmarked jobs
- **job_events** -- View/save/apply event tracking
- **click_events** -- Outbound link click tracking
- **user_visits** -- Authenticated visit tracking (returning visitor rate)
- **startup_contacts** -- Admin-managed contact database for outreach
- **student_resumes** -- Resume file references (Supabase Storage)
- **email_drafts** -- AI-generated email drafts with status lifecycle
- **gmail_tokens** -- Encrypted OAuth tokens for Gmail sending
- **career_insights** -- Career advice articles with featured images
- **feed_logs** -- Excel upload audit trail

---

## Documentation

- `ENV_SETUP_GUIDE.md` -- Step-by-step guide for creating all API keys and credentials
- `TECHNICAL_BRIEF.md` -- Deep-dive into architecture, embedding pipeline, recommendation algorithm, email automation, and design decisions
- `pathfinder-backend/ONBOARDING.md` -- Backend architecture, project structure, request lifecycle, and API endpoint reference

---

## Database Migration

To migrate data from an existing Pathfinder deployment:

```bash
# Export from old project (use port 5432 for pg_dump)
pg_dump "postgresql://postgres.<old-ref>:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl --clean --if-exists > backup.sql

# Import into new project
psql "postgresql://postgres.<new-ref>:<password>@aws-1-us-east-1.pooler.supabase.com:5432/postgres" < backup.sql
```

Note: Auth users and Storage files do not transfer automatically. See `ENV_SETUP_GUIDE.md` for details.

---

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test locally (backend on port 8000, frontend on port 3000)
4. Submit a pull request

---

## License

This project is developed for CanWorks, a Canadian workforce development non-profit.

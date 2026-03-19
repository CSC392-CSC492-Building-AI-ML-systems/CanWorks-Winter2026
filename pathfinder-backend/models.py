import uuid
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, Date, DateTime, JSON, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship
from database import Base


class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    uploaded_by = Column(String, nullable=False)  # "admin" or "employer"
    employer_id = Column(String, nullable=True, index=True)  # Supabase auth user id; NULL for admin uploads

    # Core fields
    title = Column(String, nullable=False)
    employer = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    responsibilities = Column(Text, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    mode = Column(String, nullable=True)  # Remote / On Site / Hybrid
    compensation_min = Column(Numeric, nullable=True)
    compensation_max = Column(Numeric, nullable=True)
    compensation_currency = Column(String, default="CAD")
    application_deadline = Column(Date, nullable=True)
    employment_type = Column(String, nullable=True)  # intern, coop, new-grad, part-time, full-time
    qualifications = Column(Text, nullable=True)
    with_pay = Column(Boolean, default=True)
    start_month = Column(String, nullable=True)
    duration_months = Column(Float, nullable=True)
    target_audience = Column(String, nullable=True)
    other_academic_requirements = Column(Text, nullable=True)
    link_to_posting = Column(String, nullable=True)

    # Employer-specific
    template_id = Column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=True)
    industry = Column(String, nullable=True)
    job_function = Column(String, nullable=True)
    seniority_level = Column(String, nullable=True)

    # Status and lifecycle
    status = Column(String, default="draft")  # draft, published, inactive
    published_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    # Metadata
    dedupe_hash = Column(String, unique=True, nullable=True, index=True)
    embedding = Column(Vector(384), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")


class JobSkill(Base):
    __tablename__ = "job_skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    skill_type = Column(String, nullable=False)  # required, preferred
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    job = relationship("Job", back_populates="skills")
    skill = relationship("Skill", lazy="joined")

    @property
    def skill_name(self):
        return self.skill.skill_name if self.skill else None


class SavedJob(Base):
    __tablename__ = "saved_jobs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="unique_user_job"),
    )

    job = relationship("Job")


class JobEvent(Base):
    __tablename__ = "job_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    job = relationship("Job")


class Template(Base):
    __tablename__ = "templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_name = Column(String, nullable=False)
    industry = Column(String, nullable=False)
    job_title = Column(String, nullable=False)
    seniority_level = Column(String, nullable=False)
    employment_type = Column(String, nullable=False)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    job_description = Column(Text, nullable=True)
    responsibilities = Column(JSON, nullable=True)
    qualifications = Column(Text, nullable=True)
    compensation_min = Column(Numeric, nullable=True)
    compensation_max = Column(Numeric, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class Skill(Base):
    __tablename__ = "skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String, nullable=False, unique=True)
    skill_category = Column(String, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Application(Base):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id = Column(String, nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending")
    student_name = Column(String, nullable=True)
    student_email = Column(String, nullable=True)
    university = Column(String, nullable=True)
    major = Column(String, nullable=True)
    graduation_year = Column(String, nullable=True)
    relevant_experience = Column(Text, nullable=True)
    resume_url = Column(String, nullable=True)
    resume_filename = Column(String, nullable=True)
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("student_user_id", "job_id", name="unique_student_application"),
    )

    job = relationship("Job")


class ClickEvent(Base):
    __tablename__ = "click_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=True, index=True)
    job_id = Column(UUID(as_uuid=True), nullable=True)
    job_type = Column(String, nullable=True)
    url = Column(String, nullable=False)
    clicked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class UserVisit(Base):
    __tablename__ = "user_visits"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    visited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FeedLog(Base):
    __tablename__ = "feed_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)
    status = Column(String, nullable=False)
    jobs_added = Column(Integer, default=0)
    jobs_skipped = Column(Integer, default=0)
    errors = Column(JSON, nullable=True)
    uploaded_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class StartupContact(Base):
    __tablename__ = "startup_contacts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contact_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    website = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class StudentResume(Base):
    __tablename__ = "student_resumes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id = Column(String, nullable=False, index=True)
    resume_url = Column(String, nullable=False)
    resume_filename = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EmailDraft(Base):
    __tablename__ = "email_drafts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id = Column(String, nullable=False, index=True)
    startup_contact_id = Column(UUID(as_uuid=True), ForeignKey("startup_contacts.id"), nullable=False)
    role_interest = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="draft")  # draft, approved, sending, sent, failed, flagged
    moderation_result = Column(String, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    startup_contact = relationship("StartupContact")


class GmailToken(Base):
    __tablename__ = "gmail_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_user_id = Column(String, nullable=False, unique=True, index=True)
    gmail_email = Column(String, nullable=True)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class CareerInsight(Base):
    __tablename__ = "career_insights"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    articleLink = Column(String, nullable=True)
    imageUrl = Column(String, nullable=True)
    readTime = Column(String, nullable=True)
    status = Column(String, default="published")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

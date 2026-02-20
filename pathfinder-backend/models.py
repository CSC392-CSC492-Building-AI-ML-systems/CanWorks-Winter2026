from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, Date, DateTime, JSON
from database import Base

class JobPosting(Base):
    # Create a table called job_postings
    __tablename__ = "job_postings"
    id = Column(Integer, primary_key = True, autoincrement=True)
    title = Column(String, nullable=False)
    employer = Column(String, nullable=False)
    posting_date = Column(Date, nullable=True)
    application_deadline = Column(Date, nullable=True)
    link_to_posting = Column(String, nullable=True)
    mode = Column(String, nullable=True)
    job_type = Column(String, nullable=True)
    term = Column(String, nullable=True)
    with_pay = Column(Boolean, default=True)
    start_month = Column(String, nullable=True)
    end_month = Column(String, nullable=True)
    duration_months = Column(Float, nullable=True)
    province = Column(String, nullable=True)
    city = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    description = Column(Text, nullable=True) # Text is different from String: Text stores longer content
    responsibilities = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    majors_required = Column(JSON, nullable=True)
    other_academic_requirements = Column(Text, nullable=True)
    assets = Column(Text, nullable=True)
    employer_notes = Column(Text, nullable=True)

    # metadata
    dedupe_hash = Column(String, unique=True, index=True) # index=True to create a db index so lookups by hash are fast
    is_active = Column(Boolean, default=True)
    # wrap datetime.now in a lambda so datetime.now runs fresh for each insert
    # without lambda, the function datetime.now is only invoked once when the table is created, making all entries have the same created_at time
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda:datetime.now(timezone.utc))


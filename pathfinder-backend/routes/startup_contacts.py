from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import StartupContact
from schemas import StartupContactCreate, StartupContactUpdate, StartupContactResponse
from auth import get_current_user

# Admin CRUD endpoints
router = APIRouter(prefix="/api/admin/startup-contacts", tags=["Startup Contacts Admin"])


@router.post("", response_model=StartupContactResponse)
def create_contact(
    data: StartupContactCreate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = StartupContact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("", response_model=list[StartupContactResponse])
def list_contacts(
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(StartupContact).order_by(StartupContact.created_at.desc()).all()


@router.put("/{contact_id}", response_model=StartupContactResponse)
def update_contact(
    contact_id: UUID,
    data: StartupContactUpdate,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(StartupContact).filter(StartupContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)

    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: UUID,
    user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(StartupContact).filter(StartupContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}


# Public read endpoint for students
public_router = APIRouter(prefix="/api/startup-contacts", tags=["Startup Contacts Public"])


@public_router.get("", response_model=list[StartupContactResponse])
def list_contacts_public(db: Session = Depends(get_db)):
    return db.query(StartupContact).order_by(StartupContact.company_name).all()

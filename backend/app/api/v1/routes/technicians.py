from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.technician import Technician
from app.models.user import User, UserRole
from app.schemas.technician import TechnicianCreate, TechnicianUpdate, TechnicianOut, TechnicianListOut
from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password

router = APIRouter()


class TechnicianWithLoginCreate(BaseModel):
    """Create a technician profile AND a login account in one call."""
    full_name: str
    phone: str
    email: str
    skills: Optional[str] = None
    is_available: bool = True
    # Login credentials
    username: str
    password: str


class LinkUserRequest(BaseModel):
    user_id: str


@router.get("", response_model=TechnicianListOut)
def list_technicians(
    search: Optional[str] = None,
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Technician)
    if active_only:
        query = query.filter(Technician.is_active == True)
    if search:
        term = f"%{search}%"
        query = query.filter(Technician.full_name.ilike(term) | Technician.phone.ilike(term))
    total = query.count()
    items = query.order_by(Technician.full_name).all()
    return TechnicianListOut(items=items, total=total)


@router.post("", response_model=TechnicianOut, status_code=201)
def create_technician(
    payload: TechnicianCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tech = Technician(**payload.model_dump())
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return tech


@router.post("/with-login", response_model=TechnicianOut, status_code=201)
def create_technician_with_login(
    payload: TechnicianWithLoginCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Create a technician profile AND a User login account linked together."""
    # Check email uniqueness
    existing_user = db.query(User).filter(
        (User.username == payload.username) | (User.email == payload.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already taken")

    existing_tech = db.query(Technician).filter(Technician.email == payload.email).first()
    if existing_tech:
        raise HTTPException(status_code=400, detail="A technician with this email already exists")

    # Create User account
    user = User(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=UserRole.TECHNICIAN,
    )
    db.add(user)
    db.flush()

    # Create Technician profile linked to that user
    tech = Technician(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        skills=payload.skills,
        is_available=payload.is_available,
        user_id=user.id,
    )
    db.add(tech)
    db.commit()
    db.refresh(tech)
    return tech


@router.post("/{tech_id}/link-user", response_model=TechnicianOut)
def link_user_to_technician(
    tech_id: str,
    payload: LinkUserRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """Link an existing User account to a Technician profile."""
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    tech.user_id = user.id
    db.commit()
    db.refresh(tech)
    return tech


@router.get("/{tech_id}", response_model=TechnicianOut)
def get_technician(
    tech_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    return tech


@router.put("/{tech_id}", response_model=TechnicianOut)
def update_technician(
    tech_id: str,
    payload: TechnicianUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(tech, field, value)
    db.commit()
    db.refresh(tech)
    return tech


@router.delete("/{tech_id}", status_code=204)
def delete_technician(
    tech_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tech = db.query(Technician).filter(Technician.id == tech_id).first()
    if not tech:
        raise HTTPException(status_code=404, detail="Technician not found")
    tech.is_active = False
    db.commit()

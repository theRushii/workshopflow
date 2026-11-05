from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.technician import Technician
from app.schemas.technician import TechnicianCreate, TechnicianUpdate, TechnicianOut, TechnicianListOut
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


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

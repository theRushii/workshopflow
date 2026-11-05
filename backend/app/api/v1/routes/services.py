from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service_category import ServiceCategory
from app.schemas.service_category import ServiceCategoryCreate, ServiceCategoryUpdate, ServiceCategoryOut
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=list[ServiceCategoryOut])
def list_services(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    query = db.query(ServiceCategory)
    if active_only:
        query = query.filter(ServiceCategory.is_active == True)
    return query.order_by(ServiceCategory.name).all()


@router.post("", response_model=ServiceCategoryOut, status_code=201)
def create_service(
    payload: ServiceCategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = db.query(ServiceCategory).filter(ServiceCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service category with this name already exists")
    svc = ServiceCategory(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return svc


@router.get("/{svc_id}", response_model=ServiceCategoryOut)
def get_service(svc_id: str, db: Session = Depends(get_db)):
    svc = db.query(ServiceCategory).filter(ServiceCategory.id == svc_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    return svc


@router.put("/{svc_id}", response_model=ServiceCategoryOut)
def update_service(
    svc_id: str,
    payload: ServiceCategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = db.query(ServiceCategory).filter(ServiceCategory.id == svc_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return svc


@router.delete("/{svc_id}", status_code=204)
def delete_service(
    svc_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    svc = db.query(ServiceCategory).filter(ServiceCategory.id == svc_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Service not found")
    svc.is_active = False
    db.commit()

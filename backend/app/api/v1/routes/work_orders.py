from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.work_order import WorkOrder, WorkOrderStatusHistory, WorkOrderStatus
from app.models.customer import Customer
from app.models.technician import Technician
from app.schemas.work_order import (
    WorkOrderCreate, WorkOrderUpdate, WorkOrderOut,
    WorkOrderListOut, WorkOrderStatusUpdate
)
from app.core.deps import get_current_user
from app.core.utils import generate_work_order_number
from app.models.user import User

router = APIRouter()


def enrich_work_order(wo: WorkOrder) -> dict:
    data = {
        "id": wo.id,
        "work_order_number": wo.work_order_number,
        "service_request_id": wo.service_request_id,
        "customer_id": wo.customer_id,
        "technician_id": wo.technician_id,
        "title": wo.title,
        "description": wo.description,
        "priority": wo.priority,
        "status": wo.status,
        "scheduled_date": wo.scheduled_date,
        "completed_date": wo.completed_date,
        "work_performed": wo.work_performed,
        "completion_notes": wo.completion_notes,
        "internal_notes": wo.internal_notes,
        "created_at": wo.created_at,
        "updated_at": wo.updated_at,
        "status_history": wo.status_history,
        "customer_name": wo.customer.full_name if wo.customer else None,
        "technician_name": wo.technician.full_name if wo.technician else None,
    }
    return data


@router.get("", response_model=WorkOrderListOut)
def list_work_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    status: Optional[WorkOrderStatus] = None,
    technician_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(WorkOrder)
    if status:
        query = query.filter(WorkOrder.status == status)
    if technician_id:
        query = query.filter(WorkOrder.technician_id == technician_id)
    if customer_id:
        query = query.filter(WorkOrder.customer_id == customer_id)
    if search:
        term = f"%{search}%"
        query = query.filter(WorkOrder.work_order_number.ilike(term) | WorkOrder.title.ilike(term))
    total = query.count()
    items = query.order_by(WorkOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    enriched = [WorkOrderOut(**enrich_work_order(wo)) for wo in items]
    return WorkOrderListOut(items=enriched, total=total, page=page, page_size=page_size)


@router.post("", response_model=WorkOrderOut, status_code=201)
def create_work_order(
    payload: WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for _ in range(10):
        wo_num = generate_work_order_number()
        if not db.query(WorkOrder).filter(WorkOrder.work_order_number == wo_num).first():
            break

    wo = WorkOrder(
        work_order_number=wo_num,
        **payload.model_dump(),
    )
    db.add(wo)
    db.flush()

    history = WorkOrderStatusHistory(
        work_order_id=wo.id,
        old_status=None,
        new_status="pending",
        notes="Work order created",
        changed_by=current_user.full_name,
    )
    db.add(history)
    db.commit()
    db.refresh(wo)
    return WorkOrderOut(**enrich_work_order(wo))


@router.get("/{wo_id}", response_model=WorkOrderOut)
def get_work_order(
    wo_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    return WorkOrderOut(**enrich_work_order(wo))


@router.put("/{wo_id}", response_model=WorkOrderOut)
def update_work_order(
    wo_id: str,
    payload: WorkOrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(wo, field, value)
    db.commit()
    db.refresh(wo)
    return WorkOrderOut(**enrich_work_order(wo))


@router.patch("/{wo_id}/status", response_model=WorkOrderOut)
def update_work_order_status(
    wo_id: str,
    payload: WorkOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found")

    old_status = wo.status.value
    wo.status = payload.status

    if payload.status == WorkOrderStatus.COMPLETED:
        from datetime import date
        wo.completed_date = wo.completed_date or date.today()

    history = WorkOrderStatusHistory(
        work_order_id=wo.id,
        old_status=old_status,
        new_status=payload.status.value,
        notes=payload.notes,
        changed_by=current_user.full_name,
    )
    db.add(history)
    db.commit()
    db.refresh(wo)
    return WorkOrderOut(**enrich_work_order(wo))

"""
Technician Portal API — endpoints for logged-in technicians.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.technician import Technician
from app.models.work_order import WorkOrder, WorkOrderStatusHistory, WorkOrderStatus
from app.schemas.work_order import WorkOrderOut, WorkOrderStatusUpdate
from app.schemas.technician import TechnicianOut
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


def _enrich(wo: WorkOrder) -> dict:
    return {
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


def _get_technician_profile(current_user: User, db: Session) -> Technician:
    tech = db.query(Technician).filter(Technician.user_id == current_user.id).first()
    if not tech:
        raise HTTPException(
            status_code=404,
            detail="No technician profile linked to this account. Ask admin to link your profile."
        )
    return tech


@router.get("/profile", response_model=TechnicianOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_technician_profile(current_user, db)


@router.patch("/availability")
def update_availability(
    available: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tech = _get_technician_profile(current_user, db)
    tech.is_available = available
    db.commit()
    return {"message": f"Availability set to {'available' if available else 'unavailable'}", "is_available": available}


@router.get("/work-orders", response_model=list[WorkOrderOut])
def get_my_work_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tech = _get_technician_profile(current_user, db)
    orders = db.query(WorkOrder).filter(
        WorkOrder.technician_id == tech.id,
        WorkOrder.status.notin_([WorkOrderStatus.CANCELLED])
    ).order_by(WorkOrder.created_at.desc()).all()
    return [WorkOrderOut(**_enrich(wo)) for wo in orders]


@router.patch("/work-orders/{wo_id}/status", response_model=WorkOrderOut)
def update_my_work_order_status(
    wo_id: str,
    payload: WorkOrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tech = _get_technician_profile(current_user, db)
    wo = db.query(WorkOrder).filter(
        WorkOrder.id == wo_id,
        WorkOrder.technician_id == tech.id
    ).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Work order not found or not assigned to you")

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
    return WorkOrderOut(**_enrich(wo))


@router.get("/dashboard")
def get_my_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tech = _get_technician_profile(current_user, db)
    all_orders = db.query(WorkOrder).filter(WorkOrder.technician_id == tech.id).all()

    pending   = sum(1 for wo in all_orders if wo.status.value in ("pending", "assigned"))
    active    = sum(1 for wo in all_orders if wo.status.value == "in_progress")
    completed = sum(1 for wo in all_orders if wo.status.value == "completed")
    on_hold   = sum(1 for wo in all_orders if wo.status.value == "on_hold")

    recent = sorted(
        [wo for wo in all_orders if wo.status.value not in ("completed", "cancelled")],
        key=lambda w: w.created_at, reverse=True
    )[:5]

    return {
        "technician": {
            "id": tech.id,
            "full_name": tech.full_name,
            "phone": tech.phone,
            "skills": tech.skills,
            "is_available": tech.is_available,
        },
        "stats": {
            "pending": pending,
            "active": active,
            "completed": completed,
            "on_hold": on_hold,
            "total": len(all_orders),
        },
        "recent_work_orders": [_enrich(wo) for wo in recent],
    }

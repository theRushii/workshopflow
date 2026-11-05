from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.database import get_db
from app.models.service_request import ServiceRequest, ServiceRequestStatusHistory, ServiceRequestStatus
from app.models.customer import Customer
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestOut, ServiceRequestListOut,
    ServiceRequestStatusUpdate, PublicTrackOut
)
from app.core.deps import get_current_user
from app.core.utils import generate_service_request_number
from app.models.user import User

router = APIRouter()


@router.get("", response_model=ServiceRequestListOut)
def list_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    status: Optional[ServiceRequestStatus] = None,
    search: Optional[str] = None,
    customer_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(ServiceRequest)
    if status:
        query = query.filter(ServiceRequest.status == status)
    if customer_id:
        query = query.filter(ServiceRequest.customer_id == customer_id)
    if search:
        term = f"%{search}%"
        query = query.filter(
            ServiceRequest.customer_name.ilike(term) |
            ServiceRequest.reference_number.ilike(term) |
            ServiceRequest.customer_phone.ilike(term)
        )
    total = query.count()
    items = query.order_by(ServiceRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return ServiceRequestListOut(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ServiceRequestOut, status_code=201)
def create_request(
    payload: ServiceRequestCreate,
    db: Session = Depends(get_db),
):
    # Generate unique reference
    for _ in range(10):
        ref = generate_service_request_number()
        if not db.query(ServiceRequest).filter(ServiceRequest.reference_number == ref).first():
            break

    # Try to link to existing customer by phone
    customer = db.query(Customer).filter(Customer.phone == payload.customer_phone).first()

    req = ServiceRequest(
        reference_number=ref,
        customer_id=customer.id if customer else None,
        **payload.model_dump(),
    )
    db.add(req)
    db.flush()

    # Add initial status history
    history = ServiceRequestStatusHistory(
        service_request_id=req.id,
        old_status=None,
        new_status=ServiceRequestStatus.NEW.value,
        notes="Service request submitted",
    )
    db.add(history)
    db.commit()
    db.refresh(req)
    return req


@router.get("/{req_id}", response_model=ServiceRequestOut)
def get_request(
    req_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return req


@router.patch("/{req_id}/status", response_model=ServiceRequestOut)
def update_request_status(
    req_id: str,
    payload: ServiceRequestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")

    old_status = req.status.value
    req.status = payload.status

    history = ServiceRequestStatusHistory(
        service_request_id=req.id,
        old_status=old_status,
        new_status=payload.status.value,
        notes=payload.notes,
        changed_by=current_user.full_name,
    )
    db.add(history)
    db.commit()
    db.refresh(req)
    return req


@router.post("/{req_id}/convert", status_code=201)
def convert_to_work_order(
    req_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.models.work_order import WorkOrder, WorkOrderStatusHistory
    from app.core.utils import generate_work_order_number

    req = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    if req.status == ServiceRequestStatus.CONVERTED:
        raise HTTPException(status_code=400, detail="Already converted to a work order")

    # Ensure customer exists
    customer = None
    if req.customer_id:
        customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        customer = Customer(
            full_name=req.customer_name,
            phone=req.customer_phone,
            email=req.customer_email,
            address=req.customer_address,
        )
        db.add(customer)
        db.flush()

    # Generate unique work order number
    for _ in range(10):
        wo_num = generate_work_order_number()
        if not db.query(WorkOrder).filter(WorkOrder.work_order_number == wo_num).first():
            break

    wo = WorkOrder(
        work_order_number=wo_num,
        service_request_id=req.id,
        customer_id=customer.id,
        title=f"Service: {req.problem_description[:100]}",
        description=req.problem_description,
        scheduled_date=req.preferred_date,
    )
    db.add(wo)
    db.flush()

    wo_history = WorkOrderStatusHistory(
        work_order_id=wo.id,
        old_status=None,
        new_status="pending",
        notes="Created from service request",
        changed_by=current_user.full_name,
    )
    db.add(wo_history)

    # Update request status
    old_status = req.status.value
    req.status = ServiceRequestStatus.CONVERTED
    req.customer_id = customer.id
    req_history = ServiceRequestStatusHistory(
        service_request_id=req.id,
        old_status=old_status,
        new_status=ServiceRequestStatus.CONVERTED.value,
        notes=f"Converted to work order {wo_num}",
        changed_by=current_user.full_name,
    )
    db.add(req_history)
    db.commit()

    return {"message": "Converted successfully", "work_order_id": wo.id, "work_order_number": wo_num}


# Public tracking endpoint
@router.get("/public/track/{reference}", response_model=PublicTrackOut)
def track_request(reference: str, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.reference_number == reference).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return req

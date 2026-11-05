from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from decimal import Decimal
from datetime import date
from app.db.database import get_db
from app.models.service_request import ServiceRequest
from app.models.work_order import WorkOrder
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/service-requests")
def report_service_requests(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(ServiceRequest)
    if start_date:
        query = query.filter(ServiceRequest.created_at >= start_date)
    if end_date:
        query = query.filter(ServiceRequest.created_at <= end_date)

    status_counts = db.query(
        ServiceRequest.status, func.count(ServiceRequest.id)
    ).group_by(ServiceRequest.status)

    if start_date:
        status_counts = status_counts.filter(ServiceRequest.created_at >= start_date)
    if end_date:
        status_counts = status_counts.filter(ServiceRequest.created_at <= end_date)

    return {
        "total": query.count(),
        "by_status": {row[0].value: row[1] for row in status_counts.all()},
    }


@router.get("/work-orders")
def report_work_orders(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(WorkOrder)
    if start_date:
        query = query.filter(WorkOrder.created_at >= start_date)
    if end_date:
        query = query.filter(WorkOrder.created_at <= end_date)

    status_counts = db.query(
        WorkOrder.status, func.count(WorkOrder.id)
    ).group_by(WorkOrder.status)

    return {
        "total": query.count(),
        "by_status": {row[0].value: row[1] for row in status_counts.all()},
    }


@router.get("/revenue")
def report_revenue(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    payment_query = db.query(func.sum(Payment.amount))
    invoice_query = db.query(
        func.sum(Invoice.total_amount),
        func.sum(Invoice.amount_paid),
        func.sum(Invoice.balance_due),
    ).filter(Invoice.status != InvoiceStatus.CANCELLED)

    if start_date:
        payment_query = payment_query.filter(Payment.created_at >= start_date)
        invoice_query = invoice_query.filter(Invoice.invoice_date >= start_date)
    if end_date:
        payment_query = payment_query.filter(Payment.created_at <= end_date)
        invoice_query = invoice_query.filter(Invoice.invoice_date <= end_date)

    total_collected = payment_query.scalar() or Decimal("0")
    inv_data = invoice_query.first()
    total_invoiced = inv_data[0] or Decimal("0")
    total_paid = inv_data[1] or Decimal("0")
    total_outstanding = inv_data[2] or Decimal("0")

    return {
        "total_collected": float(total_collected),
        "total_invoiced": float(total_invoiced),
        "total_paid": float(total_paid),
        "total_outstanding": float(total_outstanding),
    }

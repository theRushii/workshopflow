from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, case
from decimal import Decimal
from datetime import datetime
from app.db.database import get_db, engine
from app.models.customer import Customer
from app.models.service_request import ServiceRequest, ServiceRequestStatus
from app.models.work_order import WorkOrder, WorkOrderStatus
from app.models.technician import Technician
from app.models.invoice import Invoice, InvoiceStatus
from app.models.payment import Payment
from app.schemas.dashboard import DashboardSummary, DashboardCharts, ChartDataPoint, RevenueDataPoint
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

IS_SQLITE = engine.dialect.name == "sqlite"


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    total_customers = db.query(func.count(Customer.id)).filter(Customer.is_active == True).scalar() or 0
    total_requests = db.query(func.count(ServiceRequest.id)).scalar() or 0
    pending_requests = db.query(func.count(ServiceRequest.id)).filter(
        ServiceRequest.status.in_([ServiceRequestStatus.NEW, ServiceRequestStatus.UNDER_REVIEW])
    ).scalar() or 0
    active_wo = db.query(func.count(WorkOrder.id)).filter(
        WorkOrder.status.in_([WorkOrderStatus.PENDING, WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS])
    ).scalar() or 0
    completed_jobs = db.query(func.count(WorkOrder.id)).filter(
        WorkOrder.status == WorkOrderStatus.COMPLETED
    ).scalar() or 0
    total_techs = db.query(func.count(Technician.id)).filter(Technician.is_active == True).scalar() or 0
    unpaid_invoices = db.query(func.count(Invoice.id)).filter(
        Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID])
    ).scalar() or 0
    revenue = db.query(func.sum(Payment.amount)).scalar() or Decimal("0")

    return DashboardSummary(
        total_customers=total_customers,
        total_service_requests=total_requests,
        pending_requests=pending_requests,
        active_work_orders=active_wo,
        completed_jobs=completed_jobs,
        total_technicians=total_techs,
        unpaid_invoices=unpaid_invoices,
        revenue_collected=Decimal(str(revenue)),
    )


@router.get("/charts", response_model=DashboardCharts)
def get_charts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    current_year = datetime.now().year
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    # ── Monthly service requests ──────────────────────────────
    if IS_SQLITE:
        monthly_data = db.query(
            func.strftime("%m", ServiceRequest.created_at).label("month"),
            func.count(ServiceRequest.id).label("count"),
        ).filter(
            func.strftime("%Y", ServiceRequest.created_at) == str(current_year)
        ).group_by("month").all()
        monthly_map = {row.month: row.count for row in monthly_data}
    else:
        monthly_data = db.query(
            extract("month", ServiceRequest.created_at).label("month"),
            func.count(ServiceRequest.id).label("count"),
        ).filter(
            extract("year", ServiceRequest.created_at) == current_year
        ).group_by("month").all()
        monthly_map = {f"{int(row.month):02d}": row.count for row in monthly_data}

    monthly_requests = [
        ChartDataPoint(label=month_names[i], value=monthly_map.get(f"{i+1:02d}", 0))
        for i in range(12)
    ]

    # ── Work order status distribution ────────────────────────
    status_data = db.query(
        WorkOrder.status,
        func.count(WorkOrder.id).label("count")
    ).group_by(WorkOrder.status).all()

    wo_status_chart = [
        ChartDataPoint(label=row.status.value.replace("_", " ").title(), value=row.count)
        for row in status_data
    ]

    # ── Monthly revenue ───────────────────────────────────────
    if IS_SQLITE:
        revenue_data = db.query(
            func.strftime("%m", Payment.created_at).label("month"),
            func.sum(Payment.amount).label("total"),
        ).filter(
            func.strftime("%Y", Payment.created_at) == str(current_year)
        ).group_by("month").all()
        revenue_map = {row.month: float(row.total or 0) for row in revenue_data}
    else:
        revenue_data = db.query(
            extract("month", Payment.created_at).label("month"),
            func.sum(Payment.amount).label("total"),
        ).filter(
            extract("year", Payment.created_at) == current_year
        ).group_by("month").all()
        revenue_map = {f"{int(row.month):02d}": float(row.total or 0) for row in revenue_data}

    monthly_revenue = [
        RevenueDataPoint(label=month_names[i], value=revenue_map.get(f"{i+1:02d}", 0.0))
        for i in range(12)
    ]

    return DashboardCharts(
        monthly_requests=monthly_requests,
        work_order_status=wo_status_chart,
        monthly_revenue=monthly_revenue,
    )

from pydantic import BaseModel
from typing import List
from decimal import Decimal


class DashboardSummary(BaseModel):
    total_customers: int
    total_service_requests: int
    pending_requests: int
    active_work_orders: int
    completed_jobs: int
    total_technicians: int
    unpaid_invoices: int
    revenue_collected: Decimal


class ChartDataPoint(BaseModel):
    label: str
    value: int


class RevenueDataPoint(BaseModel):
    label: str
    value: float


class DashboardCharts(BaseModel):
    monthly_requests: List[ChartDataPoint]
    work_order_status: List[ChartDataPoint]
    monthly_revenue: List[RevenueDataPoint]

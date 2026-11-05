from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.work_order import WorkOrderStatus, WorkOrderPriority


class WorkOrderCreate(BaseModel):
    customer_id: str
    service_request_id: Optional[str] = None
    technician_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: WorkOrderPriority = WorkOrderPriority.MEDIUM
    scheduled_date: Optional[date] = None


class WorkOrderUpdate(BaseModel):
    technician_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[WorkOrderPriority] = None
    scheduled_date: Optional[date] = None
    completed_date: Optional[date] = None
    work_performed: Optional[str] = None
    completion_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class WorkOrderStatusUpdate(BaseModel):
    status: WorkOrderStatus
    notes: Optional[str] = None


class WorkOrderStatusHistoryOut(BaseModel):
    id: str
    old_status: Optional[str]
    new_status: str
    notes: Optional[str]
    changed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkOrderOut(BaseModel):
    id: str
    work_order_number: str
    service_request_id: Optional[str]
    customer_id: str
    technician_id: Optional[str]
    title: str
    description: Optional[str]
    priority: WorkOrderPriority
    status: WorkOrderStatus
    scheduled_date: Optional[date]
    completed_date: Optional[date]
    work_performed: Optional[str]
    completion_notes: Optional[str]
    internal_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    status_history: List[WorkOrderStatusHistoryOut] = []

    # Joined fields
    customer_name: Optional[str] = None
    technician_name: Optional[str] = None

    model_config = {"from_attributes": True}


class WorkOrderListOut(BaseModel):
    items: list[WorkOrderOut]
    total: int
    page: int
    page_size: int

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from app.models.service_request import ServiceRequestStatus, ServiceRequestPriority


class ServiceRequestCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None
    service_category_id: Optional[str] = None
    equipment_details: Optional[str] = None
    problem_description: str
    preferred_date: Optional[date] = None
    additional_notes: Optional[str] = None
    priority: ServiceRequestPriority = ServiceRequestPriority.MEDIUM


class ServiceRequestStatusUpdate(BaseModel):
    status: ServiceRequestStatus
    notes: Optional[str] = None


class ServiceRequestPriorityUpdate(BaseModel):
    priority: ServiceRequestPriority


class ServiceRequestInternalNotes(BaseModel):
    internal_notes: str


class StatusHistoryOut(BaseModel):
    id: str
    old_status: Optional[str]
    new_status: str
    notes: Optional[str]
    changed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ServiceRequestOut(BaseModel):
    id: str
    reference_number: str
    customer_id: Optional[str]
    service_category_id: Optional[str]
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    customer_address: Optional[str]
    equipment_details: Optional[str]
    problem_description: str
    preferred_date: Optional[date]
    additional_notes: Optional[str]
    priority: ServiceRequestPriority = ServiceRequestPriority.MEDIUM
    status: ServiceRequestStatus
    internal_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryOut] = []

    model_config = {"from_attributes": True}


class ServiceRequestListOut(BaseModel):
    items: list[ServiceRequestOut]
    total: int
    page: int
    page_size: int


class PublicTrackOut(BaseModel):
    reference_number: str
    customer_name: str
    status: ServiceRequestStatus
    problem_description: str
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryOut] = []

    model_config = {"from_attributes": True}

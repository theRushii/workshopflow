from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class ServiceCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    estimated_price: Optional[Decimal] = None
    estimated_duration_hours: Optional[Decimal] = None
    is_active: bool = True


class ServiceCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    estimated_price: Optional[Decimal] = None
    estimated_duration_hours: Optional[Decimal] = None
    is_active: Optional[bool] = None


class ServiceCategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    estimated_price: Optional[Decimal]
    estimated_duration_hours: Optional[Decimal]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

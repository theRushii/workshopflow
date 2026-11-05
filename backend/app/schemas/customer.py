from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerOut(BaseModel):
    id: str
    full_name: str
    email: Optional[str]
    phone: str
    address: Optional[str]
    notes: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerListOut(BaseModel):
    items: list[CustomerOut]
    total: int
    page: int
    page_size: int

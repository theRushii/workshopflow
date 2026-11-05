from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TechnicianCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    skills: Optional[str] = None
    is_available: bool = True


class TechnicianUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[str] = None
    is_available: Optional[bool] = None
    is_active: Optional[bool] = None


class TechnicianOut(BaseModel):
    id: str
    full_name: str
    email: Optional[str]
    phone: str
    skills: Optional[str]
    is_available: bool
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TechnicianListOut(BaseModel):
    items: list[TechnicianOut]
    total: int

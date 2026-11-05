from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime, date
from app.models.payment import PaymentMethod


class PaymentCreate(BaseModel):
    invoice_id: str
    payment_date: date
    amount: Decimal
    payment_method: PaymentMethod = PaymentMethod.CASH
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(BaseModel):
    id: str
    invoice_id: str
    payment_date: date
    amount: Decimal
    payment_method: PaymentMethod
    transaction_reference: Optional[str]
    notes: Optional[str]
    recorded_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentListOut(BaseModel):
    items: list[PaymentOut]
    total: int

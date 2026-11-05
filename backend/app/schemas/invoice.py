from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
from app.models.invoice import InvoiceStatus


class InvoiceItemCreate(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal
    item_type: str = "service"


class InvoiceItemOut(BaseModel):
    id: str
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    item_type: str

    model_config = {"from_attributes": True}


class InvoiceCreate(BaseModel):
    customer_id: str
    service_request_id: Optional[str] = None
    work_order_id: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    tax_rate: Decimal = Decimal("18.00")
    discount_amount: Decimal = Decimal("0")
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None
    terms: Optional[str] = None


class InvoiceUpdate(BaseModel):
    due_date: Optional[date] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    terms: Optional[str] = None


class InvoiceOut(BaseModel):
    id: str
    invoice_number: str
    customer_id: str
    service_request_id: Optional[str] = None
    work_order_id: Optional[str]
    invoice_date: date
    due_date: Optional[date]
    status: InvoiceStatus
    subtotal: Decimal
    discount_amount: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    notes: Optional[str]
    terms: Optional[str]
    created_at: datetime
    items: List[InvoiceItemOut] = []

    # Joined
    customer_name: Optional[str] = None
    work_order_number: Optional[str] = None
    service_request_reference: Optional[str] = None

    model_config = {"from_attributes": True}


class InvoiceListOut(BaseModel):
    items: list[InvoiceOut]
    total: int
    page: int
    page_size: int

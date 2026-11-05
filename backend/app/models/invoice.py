import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Date, Numeric, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=True)
    service_request_id = Column(String(36), ForeignKey("service_requests.id"), nullable=True)

    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)

    subtotal = Column(Numeric(12, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(12, 2), default=0, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0, nullable=False)
    amount_paid = Column(Numeric(12, 2), default=0, nullable=False)
    balance_due = Column(Numeric(12, 2), default=0, nullable=False)

    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="invoices")
    work_order = relationship("WorkOrder", back_populates="invoices")
    service_request = relationship("ServiceRequest", foreign_keys=[service_request_id])
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", lazy="select")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(10, 2), default=1, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)
    item_type = Column(String(50), default="service", nullable=False)  # service, part, labour

    invoice = relationship("Invoice", back_populates="items")

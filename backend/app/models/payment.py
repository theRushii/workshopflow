import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Date, Numeric, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    UPI = "upi"
    BANK_TRANSFER = "bank_transfer"
    CHEQUE = "cheque"
    OTHER = "other"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    payment_date = Column(Date, nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)
    transaction_reference = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    recorded_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    invoice = relationship("Invoice", back_populates="payments")

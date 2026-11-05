import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class WorkOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WorkOrderPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_order_number = Column(String(20), unique=True, nullable=False, index=True)
    service_request_id = Column(String(36), ForeignKey("service_requests.id"), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=False)
    technician_id = Column(String(36), ForeignKey("technicians.id"), nullable=True)

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(SAEnum(WorkOrderPriority), default=WorkOrderPriority.MEDIUM, nullable=False)
    status = Column(SAEnum(WorkOrderStatus), default=WorkOrderStatus.PENDING, nullable=False)

    scheduled_date = Column(Date, nullable=True)
    completed_date = Column(Date, nullable=True)
    work_performed = Column(Text, nullable=True)
    completion_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="work_orders")
    technician = relationship("Technician", back_populates="work_orders")
    service_request = relationship("ServiceRequest", back_populates="work_orders")
    status_history = relationship("WorkOrderStatusHistory", back_populates="work_order",
                                  order_by="WorkOrderStatusHistory.created_at", lazy="select")
    invoices = relationship("Invoice", back_populates="work_order", lazy="dynamic")
    inventory_transactions = relationship("InventoryTransaction", back_populates="work_order", lazy="dynamic")


class WorkOrderStatusHistory(Base):
    __tablename__ = "work_order_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    changed_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    work_order = relationship("WorkOrder", back_populates="status_history")

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Date, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class ServiceRequestStatus(str, enum.Enum):
    NEW = "new"
    UNDER_REVIEW = "under_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CONVERTED = "converted"


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_number = Column(String(20), unique=True, nullable=False, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id"), nullable=True)
    service_category_id = Column(String(36), ForeignKey("service_categories.id"), nullable=True)

    # Customer details (captured at request time, even without account)
    customer_name = Column(String(255), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_email = Column(String(255), nullable=True)
    customer_address = Column(Text, nullable=True)

    equipment_details = Column(Text, nullable=True)
    problem_description = Column(Text, nullable=False)
    preferred_date = Column(Date, nullable=True)
    additional_notes = Column(Text, nullable=True)

    status = Column(SAEnum(ServiceRequestStatus), default=ServiceRequestStatus.NEW, nullable=False)
    internal_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    customer = relationship("Customer", back_populates="service_requests")
    service_category = relationship("ServiceCategory", back_populates="service_requests")
    work_orders = relationship("WorkOrder", back_populates="service_request", lazy="dynamic")
    status_history = relationship("ServiceRequestStatusHistory", back_populates="service_request",
                                  order_by="ServiceRequestStatusHistory.created_at", lazy="select")


class ServiceRequestStatusHistory(Base):
    __tablename__ = "service_request_status_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    service_request_id = Column(String(36), ForeignKey("service_requests.id"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    notes = Column(Text, nullable=True)
    changed_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    service_request = relationship("ServiceRequest", back_populates="status_history")

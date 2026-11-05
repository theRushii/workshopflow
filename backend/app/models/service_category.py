import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from app.db.database import Base


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    estimated_price = Column(Numeric(10, 2), nullable=True)
    estimated_duration_hours = Column(Numeric(6, 1), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    service_requests = relationship("ServiceRequest", back_populates="service_category", lazy="dynamic")

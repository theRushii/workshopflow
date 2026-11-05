import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Integer, Numeric, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class TransactionType(str, enum.Enum):
    ADD = "add"
    USE = "use"
    ADJUST = "adjust"


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, index=True)
    sku = Column(String(100), unique=True, nullable=True, index=True)
    description = Column(Text, nullable=True)
    quantity = Column(Integer, default=0, nullable=False)
    unit = Column(String(50), default="pcs", nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=True)
    sell_price = Column(Numeric(10, 2), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    transactions = relationship("InventoryTransaction", back_populates="item", lazy="dynamic")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id = Column(String(36), ForeignKey("inventory_items.id"), nullable=False)
    work_order_id = Column(String(36), ForeignKey("work_orders.id"), nullable=True)
    transaction_type = Column(SAEnum(TransactionType), nullable=False)
    quantity = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    item = relationship("InventoryItem", back_populates="transactions")
    work_order = relationship("WorkOrder", back_populates="inventory_transactions")

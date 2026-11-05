from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from app.models.inventory import TransactionType


class InventoryItemCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    description: Optional[str] = None
    quantity: int = 0
    unit: str = "pcs"
    low_stock_threshold: int = 5
    cost_price: Optional[Decimal] = None
    sell_price: Optional[Decimal] = None


class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    cost_price: Optional[Decimal] = None
    sell_price: Optional[Decimal] = None
    is_active: Optional[bool] = None


class InventoryAdjust(BaseModel):
    quantity: int
    transaction_type: TransactionType
    work_order_id: Optional[str] = None
    notes: Optional[str] = None


class InventoryItemOut(BaseModel):
    id: str
    name: str
    sku: Optional[str]
    description: Optional[str]
    quantity: int
    unit: str
    low_stock_threshold: int
    cost_price: Optional[Decimal]
    sell_price: Optional[Decimal]
    is_active: bool
    is_low_stock: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_low_stock(cls, item):
        data = cls.model_validate(item)
        data.is_low_stock = item.quantity <= item.low_stock_threshold
        return data


class InventoryListOut(BaseModel):
    items: list[InventoryItemOut]
    total: int

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.inventory import InventoryItem, InventoryTransaction, TransactionType
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemOut,
    InventoryListOut, InventoryAdjust
)
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


def to_out(item: InventoryItem) -> InventoryItemOut:
    out = InventoryItemOut.model_validate(item)
    out.is_low_stock = item.quantity <= item.low_stock_threshold
    return out


@router.get("", response_model=InventoryListOut)
def list_inventory(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    items = db.query(InventoryItem).filter(InventoryItem.is_active == True).order_by(InventoryItem.name).all()
    return InventoryListOut(items=[to_out(i) for i in items], total=len(items))


@router.post("", response_model=InventoryItemOut, status_code=201)
def create_item(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.flush()

    if payload.quantity > 0:
        tx = InventoryTransaction(
            item_id=item.id,
            transaction_type=TransactionType.ADD,
            quantity=payload.quantity,
            notes="Initial stock",
            created_by=current_user.full_name,
        )
        db.add(tx)

    db.commit()
    db.refresh(item)
    return to_out(item)


@router.put("/{item_id}", response_model=InventoryItemOut)
def update_item(
    item_id: str,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return to_out(item)


@router.post("/{item_id}/adjust", response_model=InventoryItemOut)
def adjust_stock(
    item_id: str,
    payload: InventoryAdjust,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if payload.transaction_type in (TransactionType.USE, TransactionType.ADJUST):
        if payload.transaction_type == TransactionType.USE and item.quantity < payload.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        item.quantity -= payload.quantity
    else:
        item.quantity += payload.quantity

    tx = InventoryTransaction(
        item_id=item.id,
        work_order_id=payload.work_order_id,
        transaction_type=payload.transaction_type,
        quantity=payload.quantity,
        notes=payload.notes,
        created_by=current_user.full_name,
    )
    db.add(tx)
    db.commit()
    db.refresh(item)
    return to_out(item)

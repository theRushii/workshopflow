from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from app.db.database import get_db
from app.models.payment import Payment
from app.models.invoice import Invoice, InvoiceStatus
from app.schemas.payment import PaymentCreate, PaymentOut, PaymentListOut
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=PaymentListOut)
def list_payments(
    invoice_id: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Payment)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    items = query.order_by(Payment.created_at.desc()).all()
    return PaymentListOut(items=items, total=len(items))


@router.post("", response_model=PaymentOut, status_code=201)
def record_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if inv.status == InvoiceStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Cannot record payment for a cancelled invoice")

    amount = Decimal(str(payload.amount))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be positive")
    if amount > inv.balance_due:
        raise HTTPException(status_code=400, detail=f"Payment amount exceeds balance due ({inv.balance_due})")

    payment = Payment(
        **payload.model_dump(),
        recorded_by=current_user.full_name,
    )
    db.add(payment)

    # Update invoice
    inv.amount_paid = (Decimal(str(inv.amount_paid)) + amount).quantize(Decimal("0.01"))
    inv.balance_due = (Decimal(str(inv.total_amount)) - inv.amount_paid).quantize(Decimal("0.01"))

    if inv.balance_due <= 0:
        inv.status = InvoiceStatus.PAID
        inv.balance_due = Decimal("0.00")
    elif inv.amount_paid > 0:
        inv.status = InvoiceStatus.PARTIALLY_PAID

    db.commit()
    db.refresh(payment)
    return payment

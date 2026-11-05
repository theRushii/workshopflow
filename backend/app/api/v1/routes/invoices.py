from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
from app.db.database import get_db
from app.models.invoice import Invoice, InvoiceItem, InvoiceStatus
from app.models.customer import Customer
from app.models.work_order import WorkOrder
from app.models.service_request import ServiceRequest
from app.schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceOut, InvoiceListOut
from app.core.deps import get_current_user
from app.core.utils import generate_invoice_number
from app.models.user import User
from app.services.pdf_service import generate_invoice_pdf

router = APIRouter()


def enrich_invoice(inv: Invoice) -> dict:
    return {
        **{c.name: getattr(inv, c.name) for c in inv.__table__.columns},
        "items": inv.items,
        "customer_name": inv.customer.full_name if inv.customer else None,
        "work_order_number": inv.work_order.work_order_number if inv.work_order else None,
        "service_request_reference": inv.service_request.reference_number if inv.service_request else None,
    }


@router.get("", response_model=InvoiceListOut)
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[InvoiceStatus] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Invoice)
    if status:
        query = query.filter(Invoice.status == status)
    total = query.count()
    items = query.order_by(Invoice.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return InvoiceListOut(
        items=[InvoiceOut(**enrich_invoice(inv)) for inv in items],
        total=total, page=page, page_size=page_size
    )


@router.post("", response_model=InvoiceOut, status_code=201)
def create_invoice(
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate service request belongs to the customer
    if payload.service_request_id:
        sr = db.query(ServiceRequest).filter(ServiceRequest.id == payload.service_request_id).first()
        if not sr:
            raise HTTPException(status_code=404, detail="Service request not found")
        if sr.customer_id and sr.customer_id != payload.customer_id:
            raise HTTPException(status_code=400, detail="Service request does not belong to the selected customer")

    # Validate work order belongs to the customer
    if payload.work_order_id:
        wo = db.query(WorkOrder).filter(WorkOrder.id == payload.work_order_id).first()
        if not wo:
            raise HTTPException(status_code=404, detail="Work order not found")
        if wo.customer_id != payload.customer_id:
            raise HTTPException(status_code=400, detail="Work order does not belong to the selected customer")

    for _ in range(10):
        inv_num = generate_invoice_number()
        if not db.query(Invoice).filter(Invoice.invoice_number == inv_num).first():
            break

    # Calculate totals
    subtotal = Decimal("0")
    for it in payload.items:
        subtotal += Decimal(str(it.quantity)) * Decimal(str(it.unit_price))

    discount = Decimal(str(payload.discount_amount))
    taxable = subtotal - discount
    tax_rate = Decimal(str(payload.tax_rate))
    tax_amount = (taxable * tax_rate / 100).quantize(Decimal("0.01"))
    total = (taxable + tax_amount).quantize(Decimal("0.01"))

    inv = Invoice(
        invoice_number=inv_num,
        customer_id=payload.customer_id,
        service_request_id=payload.service_request_id,
        work_order_id=payload.work_order_id,
        invoice_date=payload.invoice_date,
        due_date=payload.due_date,
        tax_rate=tax_rate,
        discount_amount=discount,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total_amount=total,
        amount_paid=Decimal("0"),
        balance_due=total,
        notes=payload.notes,
        terms=payload.terms,
        status=InvoiceStatus.ISSUED,
    )
    db.add(inv)
    db.flush()

    for it in payload.items:
        qty = Decimal(str(it.quantity))
        price = Decimal(str(it.unit_price))
        inv_item = InvoiceItem(
            invoice_id=inv.id,
            description=it.description,
            quantity=qty,
            unit_price=price,
            total_price=(qty * price).quantize(Decimal("0.01")),
            item_type=it.item_type,
        )
        db.add(inv_item)

    db.commit()
    db.refresh(inv)
    return InvoiceOut(**enrich_invoice(inv))


@router.get("/{inv_id}", response_model=InvoiceOut)
def get_invoice(
    inv_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return InvoiceOut(**enrich_invoice(inv))


@router.get("/{inv_id}/pdf")
def download_invoice_pdf(
    inv_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    pdf_bytes = generate_invoice_pdf(inv, inv.customer, inv.work_order)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{inv.invoice_number}.pdf"'},
    )


@router.put("/{inv_id}", response_model=InvoiceOut)
def update_invoice(
    inv_id: str,
    payload: InvoiceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    inv = db.query(Invoice).filter(Invoice.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(inv, field, value)
    db.commit()
    db.refresh(inv)
    return InvoiceOut(**enrich_invoice(inv))

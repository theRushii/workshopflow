import io
from decimal import Decimal
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


def generate_invoice_pdf(invoice, customer, work_order=None) -> bytes:
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # Colors
    primary_color = colors.HexColor("#1e3a5f")
    accent_color = colors.HexColor("#2563eb")
    light_gray = colors.HexColor("#f8fafc")
    mid_gray = colors.HexColor("#64748b")

    # Header
    header_data = [
        [
            Paragraph(
                "<b><font size='20' color='#1e3a5f'>Rajesh Engineering Works</font></b><br/>"
                "<font size='9' color='#64748b'>WorkshopFlow — Service Management</font>",
                styles["Normal"],
            ),
            Paragraph(
                f"<b><font size='20' color='#2563eb'>INVOICE</font></b><br/>"
                f"<font size='10' color='#1e3a5f'><b>{invoice.invoice_number}</b></font>",
                ParagraphStyle("right", alignment=TA_RIGHT),
            ),
        ]
    ]
    header_table = Table(header_data, colWidths=[10 * cm, 7 * cm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=accent_color))
    story.append(Spacer(1, 0.5 * cm))

    # Bill To / Invoice Details
    inv_date = invoice.invoice_date.strftime("%d %b %Y") if invoice.invoice_date else "—"
    due_date = invoice.due_date.strftime("%d %b %Y") if invoice.due_date else "—"
    wo_ref = work_order.work_order_number if work_order else "—"

    details_data = [
        [
            Paragraph(
                f"<b><font size='9' color='#64748b'>BILL TO</font></b><br/>"
                f"<b><font size='11'>{customer.full_name}</font></b><br/>"
                f"<font size='9'>{customer.phone}</font><br/>"
                f"<font size='9'>{customer.email or ''}</font><br/>"
                f"<font size='9'>{(customer.address or '').replace(chr(10), ', ')}</font>",
                styles["Normal"],
            ),
            Paragraph(
                f"<font size='9' color='#64748b'>Invoice Date: </font><b>{inv_date}</b><br/>"
                f"<font size='9' color='#64748b'>Due Date: </font><b>{due_date}</b><br/>"
                f"<font size='9' color='#64748b'>Work Order: </font><b>{wo_ref}</b><br/>"
                f"<font size='9' color='#64748b'>Status: </font><b>{invoice.status.value.upper()}</b>",
                ParagraphStyle("right_details", alignment=TA_RIGHT),
            ),
        ]
    ]
    details_table = Table(details_data, colWidths=[10 * cm, 7 * cm])
    details_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(details_table)
    story.append(Spacer(1, 0.3 * cm))

    # Items table
    item_header = ["#", "Description", "Type", "Qty", "Unit Price (₹)", "Total (₹)"]
    item_data = [item_header]

    for idx, item in enumerate(invoice.items, 1):
        item_data.append([
            str(idx),
            item.description,
            item.item_type.capitalize(),
            str(item.quantity),
            f"{item.unit_price:,.2f}",
            f"{item.total_price:,.2f}",
        ])

    col_widths = [0.8 * cm, 7.5 * cm, 2 * cm, 1.5 * cm, 2.5 * cm, 2.7 * cm]
    items_table = Table(item_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_gray]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.5 * cm))

    # Totals
    def money(val):
        return f"₹ {Decimal(str(val)):,.2f}"

    totals_data = [
        ["", "Subtotal:", money(invoice.subtotal)],
        ["", f"Discount:", f"- {money(invoice.discount_amount)}"],
        ["", f"Tax ({invoice.tax_rate}%):", money(invoice.tax_amount)],
        ["", "TOTAL:", money(invoice.total_amount)],
        ["", "Amount Paid:", money(invoice.amount_paid)],
        ["", "Balance Due:", money(invoice.balance_due)],
    ]

    totals_table = Table(totals_data, colWidths=[10.8 * cm, 3.5 * cm, 2.7 * cm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LINEABOVE", (1, 3), (-1, 3), 1, primary_color),
        ("FONTNAME", (1, 3), (-1, 3), "Helvetica-Bold"),
        ("FONTSIZE", (1, 3), (-1, 3), 11),
        ("TEXTCOLOR", (1, 3), (-1, 3), primary_color),
        ("LINEABOVE", (1, 5), (-1, 5), 1, colors.HexColor("#e2e8f0")),
        ("FONTNAME", (1, 5), (-1, 5), "Helvetica-Bold"),
        ("TEXTCOLOR", (2, 5), (2, 5), accent_color),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(totals_table)

    # Notes
    if invoice.notes:
        story.append(Spacer(1, 0.5 * cm))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(
            f"<b><font size='9' color='#64748b'>NOTES</font></b><br/>"
            f"<font size='9'>{invoice.notes}</font>",
            styles["Normal"],
        ))

    # Footer
    story.append(Spacer(1, 1 * cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
    story.append(Paragraph(
        "<font size='8' color='#94a3b8'>Thank you for your business. "
        "This invoice was generated by WorkshopFlow — Rajesh Engineering Works.</font>",
        ParagraphStyle("footer", alignment=TA_CENTER),
    ))

    doc.build(story)
    return buffer.getvalue()

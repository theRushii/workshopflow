import random
import string
from datetime import datetime


def generate_reference(prefix: str, length: int = 6) -> str:
    """Generate a unique reference number like REQ-2024-001234"""
    year = datetime.now().year
    suffix = "".join(random.choices(string.digits, k=length))
    return f"{prefix}-{year}-{suffix}"


def generate_work_order_number() -> str:
    return generate_reference("WO")


def generate_service_request_number() -> str:
    return generate_reference("REQ")


def generate_invoice_number() -> str:
    return generate_reference("INV")

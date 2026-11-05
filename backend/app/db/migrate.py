"""
Simple runtime migration helper for SQLite development.
Adds missing columns without losing data.
Called automatically from main.py on startup.
"""
from sqlalchemy import inspect, text
from app.db.database import engine


def run_migrations():
    """Add any missing columns to existing tables."""
    inspector = inspect(engine)

    with engine.connect() as conn:
        # invoices table: add service_request_id if missing
        invoice_cols = [c["name"] for c in inspector.get_columns("invoices")]
        if "service_request_id" not in invoice_cols:
            conn.execute(text(
                "ALTER TABLE invoices ADD COLUMN service_request_id VARCHAR(36) REFERENCES service_requests(id)"
            ))
            conn.commit()
            print("✅ Migration: added service_request_id to invoices table")

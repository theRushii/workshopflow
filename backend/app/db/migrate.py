"""
Runtime migration helper for SQLite development.
Adds missing columns without losing data.
Called automatically from main.py on startup.
"""
from sqlalchemy import inspect, text
from app.db.database import engine


def run_migrations():
    """Add any missing columns to existing tables."""
    inspector = inspect(engine)

    with engine.connect() as conn:
        # invoices: service_request_id
        invoice_cols = [c["name"] for c in inspector.get_columns("invoices")]
        if "service_request_id" not in invoice_cols:
            conn.execute(text(
                "ALTER TABLE invoices ADD COLUMN service_request_id VARCHAR(36) REFERENCES service_requests(id)"
            ))
            conn.commit()
            print("✅ Migration: added service_request_id to invoices")

        # service_requests: priority
        sr_cols = [c["name"] for c in inspector.get_columns("service_requests")]
        if "priority" not in sr_cols:
            conn.execute(text(
                "ALTER TABLE service_requests ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' NOT NULL"
            ))
            conn.commit()
            print("✅ Migration: added priority to service_requests")

        # technicians: user_id
        tech_cols = [c["name"] for c in inspector.get_columns("technicians")]
        if "user_id" not in tech_cols:
            conn.execute(text(
                "ALTER TABLE technicians ADD COLUMN user_id VARCHAR(36) REFERENCES users(id)"
            ))
            conn.commit()
            print("✅ Migration: added user_id to technicians")

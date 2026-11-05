"""
Runtime migration helper — works with both SQLite and PostgreSQL.
On a fresh database all columns already exist (created by SQLAlchemy),
so migrations are skipped automatically.
Called from main.py on startup.
"""
from sqlalchemy import inspect, text
from app.db.database import engine


def run_migrations():
    """Add missing columns to existing tables if they don't already exist."""
    try:
        inspector = inspect(engine)

        # Check if tables exist at all — fresh DB needs no migration
        existing_tables = inspector.get_table_names()
        if not existing_tables:
            return  # Fresh DB — SQLAlchemy create_all handles everything

        with engine.connect() as conn:

            # invoices: service_request_id
            if "invoices" in existing_tables:
                invoice_cols = [c["name"] for c in inspector.get_columns("invoices")]
                if "service_request_id" not in invoice_cols:
                    conn.execute(text(
                        "ALTER TABLE invoices ADD COLUMN service_request_id VARCHAR(36)"
                    ))
                    conn.commit()
                    print("✅ Migration: added service_request_id to invoices")

            # service_requests: priority
            if "service_requests" in existing_tables:
                sr_cols = [c["name"] for c in inspector.get_columns("service_requests")]
                if "priority" not in sr_cols:
                    conn.execute(text(
                        "ALTER TABLE service_requests ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' NOT NULL"
                    ))
                    conn.commit()
                    print("✅ Migration: added priority to service_requests")

            # technicians: user_id
            if "technicians" in existing_tables:
                tech_cols = [c["name"] for c in inspector.get_columns("technicians")]
                if "user_id" not in tech_cols:
                    conn.execute(text(
                        "ALTER TABLE technicians ADD COLUMN user_id VARCHAR(36)"
                    ))
                    conn.commit()
                    print("✅ Migration: added user_id to technicians")

    except Exception as e:
        # Never crash the app on migration failure
        print(f"⚠️  Migration warning: {e}")

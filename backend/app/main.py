from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.api.v1 import api_router

# Import all models to register them with Base
import app.models  # noqa: F401

app = FastAPI(
    title="WorkshopFlow API",
    description="Rajesh Engineering Works — Service Management Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

# Public tracking endpoint (no auth)
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.service_request import ServiceRequest
from app.schemas.service_request import PublicTrackOut
from fastapi import HTTPException


@app.get("/api/v1/public/track/{reference}", response_model=PublicTrackOut, tags=["Public"])
def public_track(reference: str, db: Session = Depends(get_db)):
    req = db.query(ServiceRequest).filter(ServiceRequest.reference_number == reference).first()
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found")
    return req


@app.on_event("startup")
def on_startup():
    # Create tables
    Base.metadata.create_all(bind=engine)
    # Run lightweight runtime migrations
    from app.db.migrate import run_migrations
    run_migrations()
    # Bootstrap admin and seed data
    _bootstrap()


def _bootstrap():
    from app.db.database import SessionLocal
    from app.models.user import User, UserRole
    from app.models.service_category import ServiceCategory
    from app.core.security import hash_password

    db = SessionLocal()
    try:
        # Create admin user if none exists
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            admin = User(
                username=settings.ADMIN_USERNAME,
                email=settings.ADMIN_EMAIL,
                full_name="Administrator",
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            print(f"\n✅ Admin created: username={settings.ADMIN_USERNAME} | Change password after first login.\n")

        # Seed service categories if empty
        if db.query(ServiceCategory).count() == 0:
            categories = [
                ServiceCategory(name="General Repair", description="General mechanical and electrical repair services"),
                ServiceCategory(name="Preventive Maintenance", description="Scheduled maintenance and inspection services"),
                ServiceCategory(name="Welding & Fabrication", description="Welding, cutting, and metal fabrication work"),
                ServiceCategory(name="Machining", description="Lathe, milling, drilling, and CNC machining"),
                ServiceCategory(name="Pump Service", description="Pump installation, repair, and servicing"),
                ServiceCategory(name="Motor Rewinding", description="Electric motor rewinding and repair"),
                ServiceCategory(name="Hydraulic Service", description="Hydraulic cylinder and system repair"),
                ServiceCategory(name="Structural Work", description="Structural steel and framework fabrication"),
                ServiceCategory(name="Inspection & Testing", description="Equipment inspection, testing, and certification"),
                ServiceCategory(name="Other", description="Other engineering and workshop services"),
            ]
            db.add_all(categories)
            print("✅ Default service categories seeded.")

        db.commit()
    finally:
        db.close()


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "WorkshopFlow API", "version": "1.0.0"}

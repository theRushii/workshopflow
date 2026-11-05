from fastapi import APIRouter
from app.api.v1.routes import (
    auth, customers, technicians, services,
    service_requests, work_orders, inventory,
    invoices, payments, dashboard, reports,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(technicians.router, prefix="/technicians", tags=["Technicians"])
api_router.include_router(services.router, prefix="/services", tags=["Services"])
api_router.include_router(service_requests.router, prefix="/service-requests", tags=["Service Requests"])
api_router.include_router(work_orders.router, prefix="/work-orders", tags=["Work Orders"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])

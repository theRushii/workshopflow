"""
WorkshopFlow — Backend API Tests
Run: cd backend && .venv/Scripts/pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.database import Base, get_db

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///./test_workshopflow.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db

    # Bootstrap admin
    from app.db.database import SessionLocal as _SL
    app.dependency_overrides[get_db] = override_get_db
    with TestingSessionLocal() as db:
        from app.models.user import User, UserRole
        from app.models.service_category import ServiceCategory
        from app.core.security import hash_password
        admin = db.query(User).filter(User.username == "testadmin").first()
        if not admin:
            db.add(User(username="testadmin", email="testadmin@test.com", full_name="Test Admin",
                        hashed_password=hash_password("TestPass123"), role=UserRole.ADMIN))
            db.commit()

    with TestClient(app) as c:
        yield c

    Base.metadata.drop_all(bind=engine)
    import os
    try:
        os.remove("test_workshopflow.db")
    except Exception:
        pass


@pytest.fixture(scope="module")
def auth_headers(client):
    resp = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "TestPass123"})
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAuth:
    def test_login_success(self, client):
        resp = client.post("/api/v1/auth/login", json={"username": "testadmin", "password": "TestPass123"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_invalid(self, client):
        resp = client.post("/api/v1/auth/login", json={"username": "wrong", "password": "wrong"})
        assert resp.status_code == 401

    def test_get_me(self, client, auth_headers):
        resp = client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testadmin"

    def test_protected_without_token(self, client):
        resp = client.get("/api/v1/customers")
        assert resp.status_code == 403


class TestCustomers:
    def test_create_customer(self, client, auth_headers):
        resp = client.post("/api/v1/customers",
                           headers=auth_headers,
                           json={"full_name": "Test User", "phone": "9876543210"})
        assert resp.status_code == 201
        assert resp.json()["full_name"] == "Test User"

    def test_list_customers(self, client, auth_headers):
        resp = client.get("/api/v1/customers", headers=auth_headers)
        assert resp.status_code == 200
        assert "items" in resp.json()

    def test_get_customer_not_found(self, client, auth_headers):
        resp = client.get("/api/v1/customers/nonexistent-id", headers=auth_headers)
        assert resp.status_code == 404

    def test_duplicate_email_rejected(self, client, auth_headers):
        client.post("/api/v1/customers", headers=auth_headers,
                    json={"full_name": "A", "phone": "111", "email": "dup@test.com"})
        resp = client.post("/api/v1/customers", headers=auth_headers,
                           json={"full_name": "B", "phone": "222", "email": "dup@test.com"})
        assert resp.status_code == 400


class TestServiceRequests:
    def test_public_submit(self, client):
        resp = client.post("/api/v1/service-requests", json={
            "customer_name": "Public Customer",
            "customer_phone": "9000000001",
            "problem_description": "Machine not working properly",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "reference_number" in data
        assert data["status"] == "new"

    def test_public_track(self, client):
        sr = client.post("/api/v1/service-requests", json={
            "customer_name": "Track Test",
            "customer_phone": "9000000002",
            "problem_description": "Track test problem",
        }).json()
        ref = sr["reference_number"]
        resp = client.get(f"/api/v1/public/track/{ref}")
        assert resp.status_code == 200
        assert resp.json()["reference_number"] == ref

    def test_track_not_found(self, client):
        resp = client.get("/api/v1/public/track/NONEXISTENT")
        assert resp.status_code == 404

    def test_status_update(self, client, auth_headers):
        sr = client.post("/api/v1/service-requests", json={
            "customer_name": "Status Test",
            "customer_phone": "9000000003",
            "problem_description": "Status update test",
        }).json()
        resp = client.patch(f"/api/v1/service-requests/{sr['id']}/status",
                            headers=auth_headers,
                            json={"status": "accepted", "notes": "Looks good"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"


class TestWorkOrders:
    def test_create_work_order(self, client, auth_headers):
        # Create a customer first
        cust = client.post("/api/v1/customers", headers=auth_headers,
                           json={"full_name": "WO Test Customer", "phone": "9111111111"}).json()
        resp = client.post("/api/v1/work-orders", headers=auth_headers, json={
            "customer_id": cust["id"],
            "title": "Test Job",
            "priority": "medium",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "pending"
        assert "work_order_number" in data

    def test_list_work_orders(self, client, auth_headers):
        resp = client.get("/api/v1/work-orders", headers=auth_headers)
        assert resp.status_code == 200


class TestDashboard:
    def test_summary(self, client, auth_headers):
        resp = client.get("/api/v1/dashboard/summary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_customers" in data
        assert "revenue_collected" in data

    def test_charts(self, client, auth_headers):
        resp = client.get("/api/v1/dashboard/charts", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "monthly_requests" in data
        assert len(data["monthly_requests"]) == 12


class TestServices:
    def test_list_public(self, client):
        resp = client.get("/api/v1/services")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

# WorkshopFlow
## Rajesh Engineering Works — Online Service Management Platform

A complete, full-stack web application for managing engineering workshop operations.

---

## Quick Start (Windows PowerShell)

### Backend

```powershell
cd WorkshopFlow\backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
Copy-Item .env.example .env
# Edit .env if needed (default admin credentials inside)

# Start the API server
uvicorn app.main:app --reload
```

The backend starts at: **http://localhost:8000**
API Documentation: **http://localhost:8000/api/docs**

### Frontend

```powershell
cd WorkshopFlow\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend starts at: **http://localhost:5173**

---

## Admin Login

Default credentials (created on first startup):

- **Username:** `admin`
- **Password:** `Admin@123`

**Change the password after first login.**

To customize, edit `backend/.env`:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

> The admin account is created automatically if no admin exists in the database.
> Delete `workshopflow.db` to reset and re-bootstrap.

---

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Customer-facing website |
| http://localhost:5173/admin | Admin dashboard |
| http://localhost:5173/login | Staff login |
| http://localhost:5173/request-service | Public service request |
| http://localhost:5173/track | Public request tracking |
| http://localhost:8000/api/docs | Swagger API documentation |
| http://localhost:8000/api/redoc | ReDoc API documentation |

---

## Project Structure

```
WorkshopFlow/
├── backend/
│   ├── app/
│   │   ├── api/v1/routes/    # API route handlers
│   │   ├── core/             # Config, security, deps, utils
│   │   ├── db/               # Database engine and session
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # PDF generation service
│   │   └── main.py           # FastAPI app + bootstrap
│   ├── tests/                # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── context/          # Auth context
│       ├── layouts/          # Public and Admin layouts
│       ├── pages/            # Page components
│       ├── services/         # API client (axios)
│       └── types/            # TypeScript types
└── docs/                     # Documentation
```

---

## Technology Stack

**Backend:** Python 3.12, FastAPI, SQLAlchemy, SQLite/PostgreSQL, JWT, bcrypt, ReportLab

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS v4, React Router, React Hook Form, Zod, Recharts, Lucide React

---

## Running Tests

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest tests/ -v
```

---

## Production Notes

- Set a strong `SECRET_KEY` in `.env`
- Use a PostgreSQL `DATABASE_URL` in `.env`
- Build the frontend: `npm run build` in the `frontend/` folder
- Serve the `frontend/dist/` folder via a static file server or CDN
- Use HTTPS in production
- See `docs/` for full documentation

# WorkshopFlow Documentation

## Overview

WorkshopFlow is the online service management platform for Rajesh Engineering Works.

It provides:
- A customer-facing website for service enquiries and tracking
- An admin dashboard for full workshop operations management

## Architecture

- **Frontend:** Single-page React app, served on port 5173 in development
- **Backend:** FastAPI REST API on port 8000, proxied through Vite in development
- **Database:** SQLite for local development; PostgreSQL-compatible for production

## Environment Variables

See `backend/.env.example` for all available settings.

Key variables:
- `SECRET_KEY` — JWT signing key (must be changed in production)
- `DATABASE_URL` — SQLAlchemy connection string
- `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` — Bootstrap admin credentials
- `ALLOWED_ORIGINS` — CORS whitelist
- `DEFAULT_TAX_RATE` — Invoice tax rate percentage

## Data Flow

1. Customer visits website → submits service request → receives reference number
2. Admin reviews request in dashboard → accepts → converts to work order
3. Work order assigned to technician → status updated as work progresses
4. Admin creates invoice from completed work order
5. Customer pays → payment recorded → invoice balance updates

## Security Notes

- Passwords hashed with bcrypt
- JWT tokens expire after 8 hours (configurable)
- All admin routes require valid JWT
- Public routes: service list, service request submission, request tracking
- No sensitive customer info exposed on public tracking endpoint

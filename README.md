## Solar Construction AI Monorepo

This monorepo contains a web application and supporting services for:

- Materials demand forecasting and inventory optimization
- Solar PV yield prediction and system sizing
- Customer support chatbot and document assistant (RAG)

### Structure

- `frontend/` – React + TypeScript SPA (Vite) for dashboards, forms, and chat UI.
- `backend/` – Node.js + TypeScript (Express) API for core business logic and data access.
- `services/` – Python FastAPI microservices (pvlib-based solar simulation and optional forecasting).
- `scripts/` – Data import/export and maintenance scripts.
- `notebooks/` – Jupyter notebooks for experiments (forecasting models, pvlib calibration, RAG prototyping).

### Getting started

1. Install Node.js (LTS) and Python 3.10+.
2. From the repo root:
   - `npm install` (installs dependencies for `frontend` and `backend` workspaces).
3. Set up PostgreSQL and configure the connection URL in the backend `.env`.
4. Run dev servers:
   - Backend: `npm run dev:backend`
   - Frontend: `npm run dev:frontend`

Python services can be started separately from their respective folders in `services/`.


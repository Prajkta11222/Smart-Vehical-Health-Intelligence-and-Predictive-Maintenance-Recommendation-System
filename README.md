# Smart Vehicle Health Intelligence

A software-only predictive maintenance platform built from the project's saved Random Forest and SHAP artifacts. It presents vehicle dataset analysis, maintenance probability, health score, explainability, and recommendations without claiming live sensor or OBD data.

## Quick Start — One command

```powershell
# 1. Install Python dependencies (once)
python -m pip install -r backend/requirements.txt

# 2. Install Node dependencies and start everything
npm install
npm start
```

`npm start` launches **both** services simultaneously in one terminal:

- 🔵 **API** → `http://localhost:8000` (FastAPI + uvicorn, auto-reload)
- 🟣 **UI**  → `http://localhost:5173` (Vite dev server)

API docs: `http://localhost:8000/docs`

> Stop both servers at any time with **Ctrl + C**.

---

## Prerequisites

| Tool | Minimum version |
| --- | --- |
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Environment configuration

Copy `.env.example` to `.env` and edit as needed:

```powershell
copy .env.example .env
```

| Variable | Purpose | Default |
| --- | --- | --- |
| `MODEL_DIR` | Path to the folder containing `final_selected_model.joblib` and `rf_xgb_preprocessor.joblib` | `./drive-download-20260820T190522Z-1-001` |
| `DATASET_PATH` | Path to the raw CSV dataset (enables dataset exploration and vehicle analytics) | `./flex_fuel_predictive_maintenance_dataset_augmented.csv` |
| `DATABASE_URL` | SQLAlchemy connection string for prediction history | SQLite fallback (`sqlite:///./vehicle_health.db`) or PostgreSQL |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173,http://localhost` |

---

## Docker (full stack production deployment)

```powershell
docker compose up --build
```

All three services start automatically:

- 🐘 **Postgres** (`5432`) → Persistent database volume for prediction logs
- 🔵 **FastAPI Backend** (`8000`) → High-performance inference API with auto-indexed dataset and ML models
- 🌐 **Nginx Frontend** (`80` & `5173`) → Optimized React single-page app with built-in API reverse proxy

Access the web UI at `http://localhost` or `http://localhost:5173`, and Swagger docs at `http://localhost:8000/docs`.

## Render deployment

The repository includes [`render.yaml`](render.yaml), which provisions a Python API, a static Vite frontend, and a managed PostgreSQL database. In Render, choose **New > Blueprint** and select this repository. The blueprint uses these production commands:

- API build: `pip install -r backend/requirements.txt`
- API start: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT`
- Frontend build: `npm ci && npm run build` from `frontend/`

The API loads the committed model and dataset artifacts using `MODEL_DIR` and `DATASET_PATH`. Render supplies `DATABASE_URL` from the managed database. The blueprint sets `CORS_ORIGINS` and `FRONTEND_URL` for the default service names; update those two values if you rename the frontend service or attach a custom domain. For a manual setup, define `VITE_API_BASE_URL` on the frontend at build time and include that frontend origin in the API CORS variables.

---

## Development commands

```powershell
# Backend tests only
cd backend
python -m pytest tests/ -v

# Frontend type check
cd frontend
npx tsc --noEmit

# Frontend production build
cd frontend
npm run build

# Backend only
npm run start:backend

# Frontend only
npm run start:frontend
```

---

## Project structure

```text
vehical/
├── package.json               ← Root: npm start wires both services
├── backend/
│   ├── app/
│   │   ├── main.py            ← FastAPI routes, artifact loader, prediction service
│   │   └── db/                ← SQLAlchemy models and session helpers
│   ├── requirements.txt       ← Production Python dependencies
│   ├── requirements-dev.txt   ← Dev/test dependencies (pytest, httpx)
│   ├── Dockerfile             ← Hardened image (non-root user, healthcheck)
│   └── tests/                 ← API and health-score unit tests
├── frontend/
│   ├── src/
│   │   ├── App.tsx            ← Main React application
│   │   └── styles.css         ← Global styles
│   ├── vite.config.ts         ← Vite + React plugin config
│   └── index.html             ← HTML entry point
├── docker-compose.yml         ← Full stack Docker orchestration
├── drive-download-*/          ← ML artifacts (models, SHAP, health scores)
└── .env.example               ← Environment variable template
```

Health score is `100 - maintenance_probability × 100`, matching the training implementation. The original prototype (`Predictive Mainainance Frontend.html`) remains untouched for reference.

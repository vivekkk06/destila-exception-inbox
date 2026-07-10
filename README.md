# Mini Exception Inbox

## System Overview

Ingests two messy CSVs (a production plan and actual production output), detects plan-vs-actual deficit exceptions, persists them in a database, and serves them through a REST API to a React timeline UI where an operator can filter, inspect, and acknowledge/resolve each exception. The whole stack runs with a single `docker-compose up` command.

## Architecture Diagram

```
┌───────────────────────┐    ┌───────────────────────┐    ┌──────────────┐    ┌──────────────┐
│  CSVs (raw)           │ →  │  Ingest + Clean        │ →  │  FastAPI     │ →  │  React       │
│  production_plan.csv  │    │  (normalize, dedupe,   │    │  REST API    │    │  Timeline    │
│  actual_production.csv│    │   parse dates,         │    │  (container) │    │  Inbox UI    │
└───────────────────────┘    │   quarantine bad rows) │    └──────────────┘    │  (container) │
                              └───────────────────────┘                        └──────────────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │   Database   │
                                 │   (SQLite)   │
                                 └──────────────┘

  Both backend and frontend run as separate Docker containers,
  orchestrated by docker-compose.yml, sharing a bind-mounted
  data/ volume for the raw CSVs and generated SQLite DB.
```

See `docs/architecture.png` for the rendered version.

## Tech Stack

| Layer      | Technology              | Reason |
|------------|--------------------------|--------|
| Database   | SQLite                  | Zero setup, sufficient for this scope; schema translates directly to Postgres if scaling is needed |
| Backend    | FastAPI + SQLAlchemy     | Automatic OpenAPI docs, familiar Python stack, clean separation of models/schemas/services |
| Frontend   | React + Vite             | Fast dev loop, component model matches the timeline/day-group/detail-panel structure |
| Charting   | Recharts                 | Lightweight 7-day trend line chart in the detail panel |
| Containers | Docker + Docker Compose  | One-command reproducible setup — `docker-compose up` builds and runs backend + frontend together |

## Database Schema

```
raw_plan(id, plan_date_raw, plant_raw, sku_raw, planned_units_raw)
raw_actual(id, date_raw, plant_id_raw, product_code_raw, units_produced_raw)
        │                           │
        ▼                           ▼
clean_plan(id, date, plant, product_code, planned_units)
clean_actual(id, date, plant, product_code, units_produced)
        └─────────────┬─────────────┘
                       ▼
exceptions(
  id, product_code, plant, date,
  planned_units, actual_units, deficit_pct,
  severity,            -- "high" | "medium"
  status,              -- "open" | "acknowledged" | "resolved"
  created_at, updated_at
)
```

Raw tables are an untouched dump of the source CSVs (no type coercion), so cleaning logic can be re-run without re-ingesting. Clean tables hold normalized, deduplicated, typed data. `exceptions` is materialized (not computed on the fly) so status changes persist and the frontend never has to recompute deficits itself.

## Project Structure

```
├── backend/
│   ├── backend.Dockerfile             # backend container image
│   ├── app/
│   │   ├── main.py                    # FastAPI app entrypoint, CORS config
│   │   ├── core/
│   │   │   └── database.py            # SQLAlchemy engine/session setup
│   │   ├── models/
│   │   │   ├── production.py          # RawPlan, RawActual, CleanPlan, CleanActual
│   │   │   └── exception.py           # Exception_ model
│   │   ├── schemas/
│   │   │   └── exception.py           # Pydantic: ExceptionOut, ExceptionDetail, ExceptionPatch
│   │   ├── services/
│   │   │   ├── ingestion_service.py   # CSV → raw tables
│   │   │   ├── cleaning_service.py    # raw → clean tables (normalize, dedupe, parse dates)
│   │   │   └── exception_service.py   # clean tables → exceptions table
│   │   └── api/
│   │       └── exceptions.py          # GET /exceptions, GET /{id}, PATCH /{id}
│   ├── data/raw/
│   │   ├── actual_production.csv
│   │   └── production_plan.csv
│   └── requirements.txt
├── frontend/
│   ├── frontend.Dockerfile            # frontend container image
│   ├── src/
│   │   ├── App.jsx                    # top-level state, filters, data fetching
│   │   ├── main.jsx                   # React entry point
│   │   ├── api.js                     # axios client
│   │   └── components/
│   │       ├── FilterBar.jsx
│   │       ├── Timeline.jsx
│   │       ├── DayGroup.jsx
│   │       ├── ExceptionRow.jsx
│   │       └── DetailPanel.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── architecture.png
│   └── process_flow.png
├── docker-compose.yml                 # orchestrates backend + frontend containers
├── APPROACH.md
├── AI_USAGE.md
└── README.md
```

## Key Decisions

- **Why SQLite over Postgres?** No setup overhead for a scoped take-home test; the SQLAlchemy models would need no structural changes to run against Postgres later.
- **Why raw/clean table separation?** Keeps the original CSV data always recoverable and lets cleaning logic be re-run independently of ingestion — a real-world necessity once you've found data quirks after the first load.
- **How was data cleaning handled?** Normalized `sku`/`plant` casing and whitespace (`" fg-010 "` → `FG-010`), parsed mixed date formats (ISO and `DD/MM/YYYY` both appear in `production_plan.csv`), deduplicated exact-duplicate plan rows, and quarantined (rather than silently dropped or defaulted) rows with a null `planned_units`.
- **Why Docker Compose?** One command (`docker-compose up`) builds both images and runs the full pipeline — ingest → clean → detect → serve API → serve frontend — without the reviewer needing Python/Node installed locally. The backend container runs the same ingestion/cleaning/detection services on startup as the manual setup, so behavior is identical either way.
- **Why CSS files instead of inline styles?** Each component (`FilterBar`, `ExceptionRow`, `DayGroup`, `DetailPanel`) has its own scoped `.css` file with a shared set of design tokens (`index.css`) for colors/spacing, instead of inline `style={{}}` objects. Keeps styling consistent (one color per severity/status across the whole app) and makes the components easier to scan.
- **Why `VITE_API_URL`?** The API base URL is read from an environment variable (`import.meta.env.VITE_API_URL`, falling back to `http://localhost:8000`) instead of being hardcoded, so the frontend can point at a different backend URL without a code change — see `.env.example`.
- **What would I change with more time?** Add pagination, a date-range filter, basic auth on the PATCH endpoint, and a multi-stage Docker build to slim the production image. Full reasoning is in `APPROACH.md`.

## Running the Project

### Option A — Docker Compose (recommended, one command)

```bash
docker-compose up --build
```

This builds both images and starts:
- **backend** on `http://localhost:8000` — runs ingestion → cleaning → exception detection automatically on container start, then serves the API
- **frontend** on `http://localhost:5173` — Vite dev server

To run in the background:
```bash
docker-compose up -d
```

To stop:
```bash
docker-compose down
```

> **Note (Fedora/RHEL/SELinux systems):** the `backend` service's volume mount uses the `:z` suffix (`./backend/data:/app/data:z`) to relabel the SELinux context so the container can read the bind-mounted CSV directory. Without it, SELinux-enforcing hosts will throw a `PermissionError` when the container tries to read the CSVs. This isn't needed on non-SELinux systems (macOS, most Ubuntu/Debian setups) but doesn't hurt to leave in.

### Option B — Manual setup (no Docker)

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

python3 -m app.services.ingestion_service
python3 -m app.services.cleaning_service
python3 -m app.services.exception_service

uvicorn app.main:app --reload --port 8000
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser. The backend must be running on port 8000 for the frontend to fetch data.

**Don't run both options at once** — they'll compete for ports 8000/5173. Fully stop one (`docker-compose down`, or `Ctrl+C` both manual terminals) before switching.

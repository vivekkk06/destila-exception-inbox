# Mini Exception Inbox

## System Overview

Ingests two messy CSVs (a production plan and actual production output), detects plan-vs-actual deficit exceptions, persists them in a database, and serves them through a REST API to a React timeline UI where an operator can filter, inspect, and acknowledge/resolve each exception.

## Architecture Diagram

```
┌──────────────────────┐    ┌───────────────────────┐    ┌──────────────┐    ┌──────────────┐
│  CSVs (raw)          │ →  │  Ingest + Clean        │ →  │  FastAPI     │ →  │  React       │
│  production_plan.csv │    │  (normalize, dedupe,   │    │  REST API    │    │  Timeline    │
│  actual_production.csv│   │   parse dates,         │    │              │    │  Inbox UI    │
└──────────────────────┘    │   quarantine bad rows) │    └──────────────┘    └──────────────┘
                             └───────────────────────┘
                                        │
                                        ▼
                                ┌──────────────┐
                                │   Database   │
                                │   (SQLite)   │
                                └──────────────┘
```

## Tech Stack

| Layer      | Technology              | Reason |
|------------|--------------------------|--------|
| Database   | SQLite                  | Zero setup, sufficient for this scope; schema translates directly to Postgres if scaling is needed |
| Backend    | FastAPI + SQLAlchemy     | Automatic OpenAPI docs, familiar Python stack, clean separation of models/schemas/services |
| Frontend   | React + Vite             | Fast dev loop, component model matches the timeline/day-group/detail-panel structure |
| Charting   | Recharts                 | Lightweight 7-day trend line chart in the detail panel |

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
│   ├── src/
│   │   ├── App.jsx                    # top-level state, filters, data fetching
│   │   ├── api.js                     # axios client
│   │   └── components/
│   │       ├── FilterBar.jsx
│   │       ├── Timeline.jsx
│   │       ├── DayGroup.jsx
│   │       ├── ExceptionRow.jsx
│   │       └── DetailPanel.jsx
│   └── package.json
├── docs/
│   ├── architecture.png
│   └── process_flow.png
├── APPROACH.md
├── AI_USAGE.md
└── README.md
```

## Key Decisions

- **Why SQLite over Postgres?** No setup overhead for a scoped take-home test; the SQLAlchemy models would need no structural changes to run against Postgres later.
- **Why raw/clean table separation?** Keeps the original CSV data always recoverable and lets cleaning logic be re-run independently of ingestion — a real-world necessity once you've found data quirks after the first load.
- **How was data cleaning handled?** Normalized `sku`/`plant` casing and whitespace (`" fg-010 "` → `FG-010`), parsed mixed date formats (ISO and `DD/MM/YYYY` both appear in `production_plan.csv`), deduplicated exact-duplicate plan rows, and quarantined (rather than silently dropped or defaulted) rows with a null `planned_units`.
- **What would I change with more time?** Add pagination, a date-range filter, basic auth on the PATCH endpoint, and Docker Compose for one-command setup. Full reasoning is in `APPROACH.md`.

## Running the Project

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

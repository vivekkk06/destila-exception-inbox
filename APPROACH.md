# Approach

## Problem Breakdown

I broke this into five sequential stages, matching the natural data-to-UI pipeline:

1. **Inspect the data** (~30 min) — loaded both CSVs with pandas before writing any ingestion code, checked dtypes, nulls, duplicates, and cross-referenced product codes between the two files.
2. **Ingest → raw tables** (~30 min) — dumped both CSVs into `raw_plan` / `raw_actual` tables with no transformation, so the original data is always recoverable.
3. **Clean → clean tables** (~1 hr) — normalized product codes/plant IDs, parsed dates, deduped, and quarantined unusable rows.
4. **Exception detection** (~30 min) — joined clean plan vs clean actual on (date, plant, product_code), applied the 0.9 / 0.7 thresholds, materialized results into an `exceptions` table.
5. **API + Frontend** (~2–3 hrs combined) — FastAPI endpoints for list/detail/patch, then a React timeline UI consuming them.

## Process Flow Diagram

```
production_plan.csv ─┐
                      ├──▶ raw_plan / raw_actual (untouched dump)
actual_production.csv┘              │
                                     ▼
                        Cleaning Service
                (normalize sku/plant casing + whitespace,
                 parse mixed date formats, dedupe,
                 drop rows with null planned_units)
                                     │
                       ┌─────────────┴─────────────┐
                       ▼                           ▼
                  clean_plan                  clean_actual
                       └─────────────┬─────────────┘
                                     ▼
                        Exception Detection Job
                     (units_produced < 0.9 × planned →
                      severity: <0.7 high, else medium)
                                     ▼
                            exceptions table
                        (status: open/ack/resolved)
                                     ▼
                          FastAPI REST endpoints
                    GET /exceptions, GET /exceptions/{id},
                              PATCH /exceptions/{id}
                                     ▼
                        React Timeline Inbox UI
                (day groups → exception rows → detail panel
                       with 7-day trend chart + table)

                Rejected/unusable rows during cleaning are
                logged to a quarantine list rather than silently
                dropped or silently kept.
```

## Data Decisions

Inspecting both CSVs before loading surfaced several real quirks:

- **`production_plan.csv` had 2 rows with a null `planned_units`.** Can't compute a deficit ratio without a plan number, so these were quarantined (logged, not loaded into `clean_plan`) rather than defaulted to 0, which would have created false "100% deficit" exceptions.
- **13 exact duplicate rows in `production_plan.csv`.** Deduped on the full row tuple before insertion into `clean_plan`, so they don't double-count exceptions.
- **`sku` values in `production_plan.csv` were inconsistently formatted** — mixed case (`fg-010` vs `FG-010`) and leading/trailing whitespace (`" FG-006"`, `"fg-008"`). A naive join against `actual_production.csv`'s clean `product_code` values would have silently missed ~18 SKU variants. Fixed by normalizing both sides with `.strip().upper()` in the cleaning step, not by patching the join query — so the clean tables are trustworthy on their own.
- **`plan_date` had mixed date formats.** Most rows were ISO (`2017-03-05`), but at least one row was `12/03/2017` (day/month/year), which crashed a naive `strptime("%Y-%m-%d")` call. Since `12/03/2017` is ambiguous (Dec 3 vs Mar 12), I made a judgment call to try `%d/%m/%Y` before `%m/%d/%Y` (European-style), which is a reasonable default but worth flagging as an assumption — a production system would need to confirm this against the actual source system's locale.
- **Row count mismatch (1085 plan rows vs 1080 actual rows).** After cleaning, exceptions are only generated where a matching (date, plant, product_code) key exists in both clean tables — unmatched plan or actual rows are simply skipped rather than surfaced as a different exception type, which was the simplest correct behavior for this scope.

## Schema & Why

- **`raw_plan` / `raw_actual`** — exact CSV dump, no type coercion. Lets me re-run cleaning logic without re-touching the original files, and gives an audit trail back to source.
- **`clean_plan` / `clean_actual`** — typed, normalized, deduplicated. This is the trustworthy layer everything else builds on.
- **`exceptions`** — materialized rows (not computed on the fly), because the assignment explicitly requires persisted exceptions with a mutable `status` field (`open` / `acknowledged` / `resolved`) that a planner acts on — this can't live only in a frontend computation.

## API Design Notes

- Filtering (`product_code`, `severity`) is done via SQLAlchemy query params rather than pulling everything and filtering in Python, so it scales past this dataset's size.
- Sorting is `ORDER BY date DESC, deficit_pct DESC` directly in the query, matching the spec (newest day first, worst deficit first within a day) without needing frontend-side sorting.
- `GET /exceptions/{id}` builds the 7-day trend by re-querying `clean_plan`/`clean_actual` directly (not the `exceptions` table), since not every day in the trend window is necessarily an exception — the trend needs to show the full plan-vs-actual picture, exception or not.
- `PATCH` only accepts `acknowledged` or `resolved` via a Pydantic `Literal` type, so an invalid status value is rejected with a 422 rather than silently accepted.

## Tradeoffs & Shortcuts

- **SQLite instead of Postgres** — zero setup for a take-home test at this scale; the schema would translate directly if this needed to scale.
- **Single plant in the dataset** — the code is written to be plant-aware (`plant` is part of every key), but I didn't get to stress-test multi-plant edge cases since this dataset only has `PLANT-1`.
- **No pagination** on `GET /exceptions`— dataset is small enough (~1000 rows) that it wasn't a priority; would add `limit`/`offset` for a larger dataset.
- **No auth** — out of scope for the assignment's stated goals; would be required before this touches a real ERP.
- **Unmatched plan/actual rows are silently skipped** rather than surfaced as their own exception category (e.g. "actual reported with no plan") — a reasonable v2 addition but not core to the deficit-exception spec.

## Next Steps

If I had more time, I'd add:
- Pagination and a date-range filter on `GET /exceptions`
- A dedicated "unmatched records" report so silently-skipped plan/actual rows aren't invisible
- Basic auth on the PATCH endpoint (planners acting on exceptions should be identifiable)
- Docker Compose for one-command setup
- Confirming the ambiguous `DD/MM` vs `MM/DD` date assumption against the actual source system rather than guessing

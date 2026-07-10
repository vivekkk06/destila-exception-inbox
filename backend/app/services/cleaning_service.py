from datetime import datetime
from app.core.database import SessionLocal
from app.models.production import RawPlan, RawActual, CleanPlan, CleanActual

def normalize_code(s: str) -> str:
    return s.strip().upper()

def parse_date(s: str):
    """Handle mixed date formats found in the raw data (ISO and DD/MM/YYYY)."""
    s = s.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {s!r}")

def clean():
    db = SessionLocal()
    quarantined = []
    try:
        db.query(CleanPlan).delete()
        db.query(CleanActual).delete()

        seen = set()
        for row in db.query(RawPlan).all():
            if row.planned_units_raw in (None, "", "nan"):
                quarantined.append(("plan", row.id, "null planned_units"))
                continue
            key = (row.plan_date_raw, row.plant_raw, row.sku_raw, row.planned_units_raw)
            if key in seen:
                continue
            seen.add(key)

            try:
                parsed_date = parse_date(row.plan_date_raw)
            except ValueError as e:
                quarantined.append(("plan", row.id, str(e)))
                continue

            db.add(CleanPlan(
                date=parsed_date,
                plant=normalize_code(row.plant_raw),
                product_code=normalize_code(row.sku_raw),
                planned_units=float(row.planned_units_raw),
            ))

        for row in db.query(RawActual).all():
            try:
                parsed_date = parse_date(row.date_raw)
            except ValueError as e:
                quarantined.append(("actual", row.id, str(e)))
                continue

            db.add(CleanActual(
                date=parsed_date,
                plant=normalize_code(row.plant_id_raw),
                product_code=normalize_code(row.product_code_raw),
                units_produced=float(row.units_produced_raw),
            ))

        db.commit()
        print(f"Clean plan rows: {db.query(CleanPlan).count()}")
        print(f"Clean actual rows: {db.query(CleanActual).count()}")
        print(f"Quarantined: {len(quarantined)} -> {quarantined}")
    finally:
        db.close()

if __name__ == "__main__":
    clean()

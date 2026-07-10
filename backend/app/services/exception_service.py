from app.core.database import SessionLocal
from app.models.production import CleanPlan, CleanActual
from app.models.exception import Exception_

def detect():
    db = SessionLocal()
    try:
        db.query(Exception_).delete()

        actuals = {
            (a.date, a.plant, a.product_code): a.units_produced
            for a in db.query(CleanActual).all()
        }

        count = 0
        for plan in db.query(CleanPlan).all():
            key = (plan.date, plan.plant, plan.product_code)
            actual_units = actuals.get(key)
            if actual_units is None:
                continue

            if plan.planned_units <= 0:
                continue

            ratio = actual_units / plan.planned_units
            if ratio >= 0.9:
                continue

            deficit_pct = round((1 - ratio) * 100, 2)
            severity = "high" if ratio < 0.7 else "medium"

            db.add(Exception_(
                product_code=plan.product_code,
                plant=plan.plant,
                date=plan.date,
                planned_units=plan.planned_units,
                actual_units=actual_units,
                deficit_pct=deficit_pct,
                severity=severity,
                status="open",
            ))
            count += 1

        db.commit()
        print(f"Detected {count} exceptions")
    finally:
        db.close()

if __name__ == "__main__":
    detect()

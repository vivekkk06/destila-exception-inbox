import csv
from app.core.database import SessionLocal, engine, Base
from app.models.production import RawPlan, RawActual
from app.models.exception import Exception_

Base.metadata.create_all(bind=engine)

def ingest():
    db = SessionLocal()
    try:
        db.query(RawPlan).delete()
        db.query(RawActual).delete()

        with open("data/raw/production_plan.csv") as f:
            for row in csv.DictReader(f):
                db.add(RawPlan(
                    plan_date_raw=row["plan_date"],
                    plant_raw=row["plant"],
                    sku_raw=row["sku"],
                    planned_units_raw=row["planned_units"],
                ))

        with open("data/raw/actual_production.csv") as f:
            for row in csv.DictReader(f):
                db.add(RawActual(
                    date_raw=row["date"],
                    plant_id_raw=row["plant_id"],
                    product_code_raw=row["product_code"],
                    units_produced_raw=row["units_produced"],
                ))

        db.commit()
        print(f"Ingested {db.query(RawPlan).count()} plan rows, "
              f"{db.query(RawActual).count()} actual rows")
    finally:
        db.close()

if __name__ == "__main__":
    ingest()

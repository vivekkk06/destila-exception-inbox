from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import timedelta
from app.core.database import get_db
from app.models.exception import Exception_
from app.models.production import CleanPlan, CleanActual
from app.schemas.exception import ExceptionOut, ExceptionDetail, ExceptionPatch, TrendPoint

router = APIRouter(prefix="/exceptions", tags=["exceptions"])

@router.get("", response_model=list[ExceptionOut])
def list_exceptions(
    product_code: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Exception_)
    if product_code:
        q = q.filter(Exception_.product_code == product_code.strip().upper())
    if severity:
        q = q.filter(Exception_.severity == severity)
    q = q.order_by(desc(Exception_.date), desc(Exception_.deficit_pct))
    return q.all()

@router.get("/{exception_id}", response_model=ExceptionDetail)
def get_exception(exception_id: int, db: Session = Depends(get_db)):
    exc = db.query(Exception_).filter(Exception_.id == exception_id).first()
    if not exc:
        raise HTTPException(404, "Exception not found")

    start = exc.date - timedelta(days=6)
    plans = {p.date: p.planned_units for p in db.query(CleanPlan).filter(
        CleanPlan.product_code == exc.product_code,
        CleanPlan.date >= start, CleanPlan.date <= exc.date,
    )}
    actuals = {a.date: a.units_produced for a in db.query(CleanActual).filter(
        CleanActual.product_code == exc.product_code,
        CleanActual.date >= start, CleanActual.date <= exc.date,
    )}
    all_dates = sorted(set(plans) | set(actuals))
    trend = [
        TrendPoint(date=d, planned_units=plans.get(d, 0), actual_units=actuals.get(d, 0))
        for d in all_dates
    ]

    return ExceptionDetail(
        id=exc.id, product_code=exc.product_code, plant=exc.plant, date=exc.date,
        planned_units=exc.planned_units, actual_units=exc.actual_units,
        deficit_pct=exc.deficit_pct, severity=exc.severity, status=exc.status,
        trend=trend,
    )

@router.patch("/{exception_id}", response_model=ExceptionOut)
def update_exception(exception_id: int, patch: ExceptionPatch, db: Session = Depends(get_db)):
    exc = db.query(Exception_).filter(Exception_.id == exception_id).first()
    if not exc:
        raise HTTPException(404, "Exception not found")
    exc.status = patch.status
    db.commit()
    db.refresh(exc)
    return exc

from pydantic import BaseModel
from datetime import date as date_type
from typing import Literal, List

class ExceptionOut(BaseModel):
    id: int
    product_code: str
    plant: str
    date: date_type
    planned_units: float
    actual_units: float
    deficit_pct: float
    severity: str
    status: str

    class Config:
        from_attributes = True

class TrendPoint(BaseModel):
    date: date_type
    planned_units: float
    actual_units: float

class ExceptionDetail(ExceptionOut):
    trend: List[TrendPoint]

class ExceptionPatch(BaseModel):
    status: Literal["acknowledged", "resolved"]

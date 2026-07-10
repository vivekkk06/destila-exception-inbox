from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Exception_(Base):
    __tablename__ = "exceptions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_code = Column(String, index=True)
    plant = Column(String)
    date = Column(Date, index=True)
    planned_units = Column(Float)
    actual_units = Column(Float)
    deficit_pct = Column(Float)
    severity = Column(String, index=True)
    status = Column(String, default="open", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

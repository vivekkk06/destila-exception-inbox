from sqlalchemy import Column, Integer, String, Float, Date
from app.core.database import Base

class RawPlan(Base):
    __tablename__ = "raw_plan"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_date_raw = Column(String)
    plant_raw = Column(String)
    sku_raw = Column(String)
    planned_units_raw = Column(String)

class RawActual(Base):
    __tablename__ = "raw_actual"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date_raw = Column(String)
    plant_id_raw = Column(String)
    product_code_raw = Column(String)
    units_produced_raw = Column(String)

class CleanPlan(Base):
    __tablename__ = "clean_plan"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, index=True)
    plant = Column(String, index=True)
    product_code = Column(String, index=True)
    planned_units = Column(Float)

class CleanActual(Base):
    __tablename__ = "clean_actual"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, index=True)
    plant = Column(String, index=True)
    product_code = Column(String, index=True)
    units_produced = Column(Float)

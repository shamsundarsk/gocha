import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Integer, Float, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.core.compat import GUID


class ActivityRecord(Base):
    __tablename__ = "activity_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")

    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    workout_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    workout_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    active_calories: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    workout_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    workout_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class HealthRecord(Base):
    __tablename__ = "health_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")

    sleep_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sleep_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    sleep_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    sleep_quality: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    resting_heart_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class LocationRecord(Base):
    __tablename__ = "location_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy_meters: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    purpose: Mapped[str] = mapped_column(String(100), nullable=False, default="context")
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

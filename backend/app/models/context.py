import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Integer, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.core.compat import GUID


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    temperature_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feels_like_celsius: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    humidity_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    condition: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    condition_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    wind_speed_kmh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    is_suitable_outdoor: Mapped[bool] = mapped_column(Boolean, default=True)
    unsuitable_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hourly_forecast: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)


class ScreenTimeRecord(Base):
    __tablename__ = "screen_time_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    total_screen_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    recreational_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    productive_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    app_breakdown: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False, default="mobile")

import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, DateTime, Date, Integer, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.core.compat import GUID


class DailyWrapped(Base):
    __tablename__ = "daily_wrapped"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    tasks_planned: Mapped[int] = mapped_column(Integer, default=0)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_postponed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_abandoned: Mapped[int] = mapped_column(Integer, default=0)

    focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    screen_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    active_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    moments_captured: Mapped[int] = mapped_column(Integer, default=0)
    photos: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    timeline: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    events_attended: Mapped[int] = mapped_column(Integer, default=0)
    highlight_text: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_generated: Mapped[bool] = mapped_column(Boolean, default=False)

    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class WeeklyWrapped(Base):
    __tablename__ = "weekly_wrapped"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)

    tasks_planned: Mapped[int] = mapped_column(Integer, default=0)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_postponed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_abandoned: Mapped[int] = mapped_column(Integer, default=0)

    focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    active_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    steps: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    screen_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    moments_captured: Mapped[int] = mapped_column(Integer, default=0)

    most_productive_day: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    most_productive_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    completion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    daily_data: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    insights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MonthlyWrapped(Base):
    __tablename__ = "monthly_wrapped"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)

    tasks_planned: Mapped[int] = mapped_column(Integer, default=0)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_postponed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_abandoned: Mapped[int] = mapped_column(Integer, default=0)

    focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    active_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    completion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    avg_duration_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    insights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    top_categories: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class YearlyWrapped(Base):
    __tablename__ = "yearly_wrapped"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    year: Mapped[int] = mapped_column(Integer, nullable=False)

    tasks_planned: Mapped[int] = mapped_column(Integer, default=0)
    tasks_completed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_postponed: Mapped[int] = mapped_column(Integer, default=0)
    tasks_abandoned: Mapped[int] = mapped_column(Integer, default=0)

    focus_hours: Mapped[int] = mapped_column(Integer, default=0)
    active_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    completion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    insights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    highlights: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

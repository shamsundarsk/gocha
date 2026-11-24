import uuid
from datetime import datetime, time
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Time, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.compat import GUID


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    tasks: Mapped[list] = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), unique=True, nullable=False)

    wake_time: Mapped[str] = mapped_column(String(10), default="07:00")
    sleep_time: Mapped[str] = mapped_column(String(10), default="23:00")
    work_start: Mapped[str] = mapped_column(String(10), default="09:00")
    work_end: Mapped[str] = mapped_column(String(10), default="18:00")

    interests: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    notification_style: Mapped[str] = mapped_column(String(50), default="balanced")
    notification_cooldown_minutes: Mapped[int] = mapped_column(default=30)

    calendar_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    calendar_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fitness_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    fitness_provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    photos_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    screen_time_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    event_discovery_radius_km: Mapped[int] = mapped_column(default=10)
    timezone: Mapped[str] = mapped_column(String(100), default="UTC")
    demo_mode: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="preferences")

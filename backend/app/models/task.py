import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Date, Integer, Float, JSON, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.core.compat import GUID
import enum


class TaskStatus(str, enum.Enum):
    PLANNED = "planned"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"
    ABANDONED = "abandoned"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskCategory(str, enum.Enum):
    WORK = "work"
    FITNESS = "fitness"
    HEALTH = "health"
    LEARNING = "learning"
    PERSONAL = "personal"
    SOCIAL = "social"
    ERRANDS = "errands"
    CREATIVE = "creative"
    FINANCE = "finance"
    OTHER = "other"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    estimated_duration: Mapped[int] = mapped_column(Integer, default=30)
    actual_duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    priority: Mapped[str] = mapped_column(String(20), default="medium")
    is_fixed: Mapped[bool] = mapped_column(Boolean, default=False)
    fixed_start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    preferred_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    preferred_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    preferred_time_of_day: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location_latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_outdoor: Mapped[bool] = mapped_column(Boolean, default=False)

    category: Mapped[str] = mapped_column(String(50), default="other")
    tags: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    status: Mapped[str] = mapped_column(String(30), default="planned", index=True)
    scheduled_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    scheduled_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    source: Mapped[str] = mapped_column(String(50), default="manual")
    raw_input: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    parent_task_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("tasks.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="tasks")
    history: Mapped[list] = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan")
    evidence: Mapped[list] = relationship("EvidenceRecord", back_populates="task", cascade="all, delete-orphan")


class TaskHistory(Base):
    __tablename__ = "task_history"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("tasks.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False)

    action: Mapped[str] = mapped_column(String(100), nullable=False)
    old_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[str] = mapped_column(String(50), nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    task: Mapped["Task"] = relationship("Task", back_populates="history")

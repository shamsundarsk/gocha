import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, Date, Integer, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.core.compat import GUID


class ScheduleBlock(Base):
    __tablename__ = "schedule_blocks"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id"), nullable=False, index=True)
    task_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("tasks.id"), nullable=True)
    calendar_event_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    block_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    is_fixed: Mapped[bool] = mapped_column(Boolean, default=False)
    is_moveable: Mapped[bool] = mapped_column(Boolean, default=True)
    schedule_version: Mapped[int] = mapped_column(Integer, default=1)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

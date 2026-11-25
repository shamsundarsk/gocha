from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from datetime import date, datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserPreferences
from app.models.task import Task, TaskStatus
from app.models.activity import ActivityRecord
from app.models.context import ScreenTimeRecord
from app.models.wrapped import DailyWrapped
from app.services.demo_data import get_demo_day_wrapped

router = APIRouter(prefix="/wrapped", tags=["wrapped"])


@router.get("/day/{wrap_date}")
async def get_day_wrapped(
    wrap_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = prefs_result.scalar_one_or_none()

    if prefs and prefs.demo_mode:
        return get_demo_day_wrapped(wrap_date)

    # Check if already generated
    existing = await db.execute(
        select(DailyWrapped).where(
            and_(DailyWrapped.user_id == current_user.id, DailyWrapped.date == wrap_date)
        )
    )
    wrapped = existing.scalar_one_or_none()
    if wrapped and wrapped.is_generated:
        return _serialize_daily(wrapped)

    # Generate from actual data
    return await _generate_daily_wrapped(wrap_date, current_user.id, db)


async def _generate_daily_wrapped(wrap_date: date, user_id, db: AsyncSession) -> dict:
    # Tasks
    tasks_result = await db.execute(
        select(Task).where(
            and_(Task.user_id == user_id, Task.date == wrap_date)
        )
    )
    tasks = tasks_result.scalars().all()

    planned = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    postponed = sum(1 for t in tasks if t.status == TaskStatus.POSTPONED)
    abandoned = sum(1 for t in tasks if t.status == TaskStatus.ABANDONED)

    # Focus time (sum of actual_duration for completed work/learning tasks)
    focus_minutes = sum(
        t.actual_duration or t.estimated_duration
        for t in tasks
        if t.status == TaskStatus.COMPLETED and t.category in ("work", "learning", "creative")
    )

    # Activity
    activity_result = await db.execute(
        select(ActivityRecord).where(
            and_(ActivityRecord.user_id == user_id, ActivityRecord.date == wrap_date)
        )
    )
    activity = activity_result.scalars().all()
    steps = sum(a.steps or 0 for a in activity)
    distance_km = sum(a.distance_km or 0 for a in activity)
    active_minutes = sum(a.workout_duration or 0 for a in activity)

    # Screen time
    st_result = await db.execute(
        select(ScreenTimeRecord).where(
            and_(ScreenTimeRecord.user_id == user_id, ScreenTimeRecord.date == wrap_date)
        )
    )
    st = st_result.scalars().all()
    screen_time_minutes = sum(s.total_screen_time_minutes or 0 for s in st)

    # Build timeline
    timeline = []
    for t in sorted(tasks, key=lambda x: x.completed_at or datetime.utcnow()):
        if t.status == TaskStatus.COMPLETED and t.completed_at:
            icon = {"fitness": "🏃", "work": "💻", "learning": "📚", "health": "❤️"}.get(t.category, "✅")
            timeline.append({
                "time": t.completed_at.strftime("%H:%M"),
                "label": t.title,
                "type": t.category,
                "icon": icon,
                "value": f"{t.actual_duration or t.estimated_duration} min",
            })

    highlight_parts = []
    if completed == planned and planned > 0:
        highlight_parts.append(f"All {planned} tasks completed.")
    elif completed > 0:
        highlight_parts.append(f"{completed}/{planned} tasks completed.")
    if distance_km > 0:
        highlight_parts.append(f"{distance_km:.1f} km run.")
    if focus_minutes >= 60:
        highlight_parts.append(f"{focus_minutes // 60}h {focus_minutes % 60}m focused.")

    return {
        "date": str(wrap_date),
        "tasks_planned": planned,
        "tasks_completed": completed,
        "tasks_postponed": postponed,
        "tasks_abandoned": abandoned,
        "focus_minutes": focus_minutes,
        "screen_time_minutes": screen_time_minutes or None,
        "steps": steps or None,
        "active_minutes": active_minutes or None,
        "distance_km": distance_km or None,
        "moments_captured": 0,
        "events_attended": 0,
        "timeline": timeline,
        "highlight_text": " ".join(highlight_parts) or "Keep going.",
        "is_generated": True,
    }


def _serialize_daily(w: DailyWrapped) -> dict:
    return {
        "date": str(w.date),
        "tasks_planned": w.tasks_planned,
        "tasks_completed": w.tasks_completed,
        "tasks_postponed": w.tasks_postponed,
        "tasks_abandoned": w.tasks_abandoned,
        "focus_minutes": w.focus_minutes,
        "screen_time_minutes": w.screen_time_minutes,
        "steps": w.steps,
        "active_minutes": w.active_minutes,
        "distance_km": w.distance_km,
        "moments_captured": w.moments_captured,
        "events_attended": w.events_attended,
        "timeline": w.timeline or [],
        "highlight_text": w.highlight_text,
        "is_generated": w.is_generated,
    }

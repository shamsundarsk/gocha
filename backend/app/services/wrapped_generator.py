"""
Automated Day Wrapped generator — runs at end of day.
"""
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.task import Task, TaskStatus
from app.models.activity import ActivityRecord
from app.models.context import ScreenTimeRecord
from app.models.wrapped import DailyWrapped


async def generate_or_update_daily_wrapped(
    user_id: str, wrap_date: date, db: AsyncSession
) -> DailyWrapped:
    # Check existing
    existing = await db.execute(
        select(DailyWrapped).where(
            and_(DailyWrapped.user_id == user_id, DailyWrapped.date == wrap_date)
        )
    )
    wrapped = existing.scalar_one_or_none()

    # Aggregate data
    tasks_result = await db.execute(
        select(Task).where(and_(Task.user_id == user_id, Task.date == wrap_date))
    )
    tasks = tasks_result.scalars().all()

    planned = len(tasks)
    completed = sum(1 for t in tasks if t.status == TaskStatus.COMPLETED)
    postponed = sum(1 for t in tasks if t.status == TaskStatus.POSTPONED)
    abandoned = sum(1 for t in tasks if t.status == TaskStatus.ABANDONED)

    focus_minutes = sum(
        t.actual_duration or t.estimated_duration
        for t in tasks
        if t.status == TaskStatus.COMPLETED and t.category in ("work", "learning", "creative")
    )

    activity_result = await db.execute(
        select(ActivityRecord).where(
            and_(ActivityRecord.user_id == user_id, ActivityRecord.date == wrap_date)
        )
    )
    activities = activity_result.scalars().all()
    steps = sum(a.steps or 0 for a in activities)
    distance_km = sum(a.distance_km or 0 for a in activities)
    active_minutes = sum(a.workout_duration or 0 for a in activities)

    st_result = await db.execute(
        select(ScreenTimeRecord).where(
            and_(ScreenTimeRecord.user_id == user_id, ScreenTimeRecord.date == wrap_date)
        )
    )
    screen_records = st_result.scalars().all()
    screen_time = sum(s.total_screen_time_minutes or 0 for s in screen_records)

    # Timeline
    timeline = []
    for t in sorted([x for x in tasks if x.status == TaskStatus.COMPLETED and x.completed_at], key=lambda x: x.completed_at):
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

    data = {
        "tasks_planned": planned,
        "tasks_completed": completed,
        "tasks_postponed": postponed,
        "tasks_abandoned": abandoned,
        "focus_minutes": focus_minutes,
        "screen_time_minutes": screen_time or None,
        "steps": steps or None,
        "active_minutes": active_minutes or None,
        "distance_km": distance_km or None,
        "timeline": timeline,
        "highlight_text": " ".join(highlight_parts) or "Keep going.",
        "is_generated": True,
        "generated_at": datetime.utcnow(),
    }

    if wrapped:
        for k, v in data.items():
            setattr(wrapped, k, v)
    else:
        wrapped = DailyWrapped(user_id=user_id, date=wrap_date, **data)
        db.add(wrapped)

    await db.flush()
    return wrapped

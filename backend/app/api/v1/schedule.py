from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, datetime, time

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserPreferences
from app.models.task import Task, TaskStatus
from app.models.calendar import CalendarEvent
from app.engines.scheduler.adaptive_scheduler import AdaptiveScheduler, SchedulerInput, ScheduledBlock
from app.services.demo_data import get_demo_schedule

router = APIRouter(prefix="/schedule", tags=["schedule"])

scheduler = AdaptiveScheduler()


def _parse_time(t: str) -> time:
    """Parse 'HH:MM' string to time object."""
    try:
        h, m = t.split(":")
        return time(int(h), int(m))
    except Exception:
        return time(7, 0)


def _block_to_dict(b: ScheduledBlock) -> dict:
    return {
        "id": b.id,
        "task_id": b.task_id,
        "calendar_event_id": b.calendar_event_id,
        "title": b.title,
        "start": b.start.isoformat(),
        "end": b.end.isoformat(),
        "block_type": b.block_type,
        "is_fixed": b.is_fixed,
        "priority": b.priority,
        "color": b.color,
    }


@router.get("/{schedule_date}")
async def get_schedule(
    schedule_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefs_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = prefs_result.scalar_one_or_none()

    if prefs and prefs.demo_mode:
        demo = get_demo_schedule()
        # Find next action — demo blocks use scheduled_start/scheduled_end
        # Normalize them to start/end so the frontend gets consistent keys
        now = datetime.utcnow()
        normalized_demo = []
        for block in demo:
            normalized = {**block}
            # Map scheduled_start → start, scheduled_end → end
            if "scheduled_start" in block and "start" not in block:
                normalized["start"] = block["scheduled_start"]
            if "scheduled_end" in block and "end" not in block:
                normalized["end"] = block["scheduled_end"]
            # Ensure block_type exists
            if "block_type" not in normalized:
                normalized["block_type"] = "task"
            # Ensure color exists
            priority = block.get("priority", "medium")
            color_map = {"critical": "#FF453A", "high": "#FF9F0A", "medium": "#0A84FF", "low": "#8E8E93"}
            if "color" not in normalized:
                normalized["color"] = color_map.get(priority, "#0A84FF")
            normalized_demo.append(normalized)

        next_action = None
        for block in normalized_demo:
            if block.get("start"):
                try:
                    block_start = datetime.fromisoformat(block["start"])
                    if block_start >= now:
                        next_action = block
                        break
                except Exception:
                    pass

        return {
            "date": str(schedule_date),
            "blocks": normalized_demo,
            "next_action": next_action,
            "free_minutes_today": 140,
            "demo": True,
        }

    # Fetch tasks for the day
    tasks_result = await db.execute(
        select(Task).where(
            and_(
                Task.user_id == current_user.id,
                Task.date == schedule_date,
                Task.status.not_in([TaskStatus.CANCELLED, TaskStatus.ABANDONED]),
            )
        )
    )
    tasks = [
        {
            "id": str(t.id),
            "title": t.title,
            "estimated_duration": t.estimated_duration,
            "priority": t.priority,
            "is_fixed": t.is_fixed,
            "fixed_start_time": t.fixed_start_time.isoformat() if t.fixed_start_time else None,
            "preferred_time_of_day": t.preferred_time_of_day,
            "is_outdoor": t.is_outdoor,
            "category": t.category,
            "status": t.status,
            "deadline": t.deadline.isoformat() if t.deadline else None,
        }
        for t in tasks_result.scalars().all()
    ]

    # Fetch calendar events for the day
    cal_result = await db.execute(
        select(CalendarEvent).where(
            and_(
                CalendarEvent.user_id == current_user.id,
                CalendarEvent.is_cancelled == False,
            )
        )
    )
    calendar_events = [
        {
            "id": str(e.id),
            "title": e.title,
            "start_time": e.start_time.isoformat(),
            "end_time": e.end_time.isoformat(),
            "is_cancelled": e.is_cancelled,
        }
        for e in cal_result.scalars().all()
        if e.start_time.date() == schedule_date
    ]

    wake = _parse_time(prefs.wake_time if prefs else "07:00")
    sleep = _parse_time(prefs.sleep_time if prefs else "23:00")

    inp = SchedulerInput(
        user_id=str(current_user.id),
        date=datetime.combine(schedule_date, time(0, 0)),
        wake_time=wake,
        sleep_time=sleep,
        tasks=tasks,
        calendar_events=calendar_events,
        current_time=datetime.utcnow(),
        timezone=prefs.timezone if prefs else "UTC",
    )

    blocks = scheduler.build_schedule(inp)
    next_action = scheduler.get_next_action(blocks, datetime.utcnow())
    free_minutes = scheduler.get_free_time_today(blocks, datetime.utcnow(), sleep)

    return {
        "date": str(schedule_date),
        "blocks": [_block_to_dict(b) for b in blocks],
        "next_action": _block_to_dict(next_action) if next_action else None,
        "free_minutes_today": free_minutes,
        "demo": False,
    }


@router.post("/{schedule_date}/recalculate")
async def recalculate_schedule(
    schedule_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_schedule(schedule_date, db, current_user)

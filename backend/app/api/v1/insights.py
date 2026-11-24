from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, timedelta

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.wrapped import DailyWrapped
from app.services.insights_engine import generate_insights

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/")
async def get_insights(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate behavioral insights from the user's actual data."""
    cutoff = date.today() - timedelta(days=days)

    result = await db.execute(
        select(DailyWrapped).where(
            and_(
                DailyWrapped.user_id == current_user.id,
                DailyWrapped.date >= cutoff,
                DailyWrapped.is_generated == True,
            )
        ).order_by(DailyWrapped.date.desc())
    )
    wrapped_days = result.scalars().all()

    data = [
        {
            "date": str(w.date),
            "tasks_planned": w.tasks_planned,
            "tasks_completed": w.tasks_completed,
            "tasks_postponed": w.tasks_postponed,
            "tasks_abandoned": w.tasks_abandoned,
            "focus_minutes": w.focus_minutes,
            "screen_time_minutes": w.screen_time_minutes,
            "distance_km": w.distance_km,
            "active_minutes": w.active_minutes,
        }
        for w in wrapped_days
    ]

    insights = generate_insights(data)
    return {
        "insights": insights,
        "data_points": len(data),
        "minimum_required": 7,
        "has_enough_data": len(data) >= 7,
    }

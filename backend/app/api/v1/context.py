from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.services.demo_data import get_demo_context

router = APIRouter(prefix="/context", tags=["context"])


@router.get("/current")
async def get_current_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the unified context object for the current user."""
    from sqlalchemy import select
    from app.models.user import UserPreferences

    prefs_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = prefs_result.scalar_one_or_none()

    if prefs and prefs.demo_mode:
        return get_demo_context(str(current_user.id))

    # In production: build real context from adapters
    # For now return a minimal live context
    from datetime import datetime
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": str(current_user.id),
        "demo": False,
        "latitude": None,
        "longitude": None,
        "calendar_events": [],
        "steps_today": 0,
        "active_minutes_today": 0,
        "workout_completed": False,
        "temperature_celsius": None,
        "weather_condition": None,
        "is_suitable_outdoor": True,
        "screen_time_recreational_minutes": 0,
        "nearby_events": [],
        "available_minutes_today": 0,
    }


@router.post("/location")
async def update_location(
    latitude: float,
    longitude: float,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Receive a location update from the mobile app."""
    from app.models.activity import LocationRecord
    from datetime import datetime, timedelta

    # Store coarse location only, with 24h expiry
    record = LocationRecord(
        user_id=current_user.id,
        latitude=round(latitude, 2),  # ~1km precision
        longitude=round(longitude, 2),
        purpose="context",
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    db.add(record)
    return {"status": "ok"}


@router.post("/screen-time")
async def update_screen_time(
    total_minutes: int,
    recreational_minutes: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Receive screen time data from the mobile app."""
    from app.models.context import ScreenTimeRecord
    from datetime import datetime, date

    record = ScreenTimeRecord(
        user_id=current_user.id,
        date=date.today(),
        total_screen_time_minutes=total_minutes,
        recreational_minutes=recreational_minutes,
        source="mobile",
    )
    db.add(record)
    return {"status": "ok"}

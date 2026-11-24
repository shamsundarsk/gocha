from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime, date

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserPreferences
from app.models.events import Event
from app.adapters.events.event_aggregator import haversine_km
from app.services.demo_data import get_demo_context

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/nearby")
async def get_nearby_events(
    latitude: float = Query(...),
    longitude: float = Query(...),
    radius_km: float = Query(default=10.0, le=50.0),
    event_date: Optional[date] = None,
    category: Optional[str] = None,
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return nearby events sorted by distance and relevance."""
    # Check demo mode
    prefs_result = await db.execute(
        select(UserPreferences).where(UserPreferences.user_id == current_user.id)
    )
    prefs = prefs_result.scalar_one_or_none()
    if prefs and prefs.demo_mode:
        ctx = get_demo_context(str(current_user.id))
        events = ctx.get("nearby_events", [])
        if category:
            events = [e for e in events if e.get("category") == category]
        return {"events": events, "demo": True, "count": len(events)}

    # Query events within bounding box first (faster), then filter by exact distance
    lat_delta = radius_km / 111.0
    lon_delta = radius_km / (111.0 * abs(func.cos(func.radians(latitude))))

    q = select(Event).where(
        and_(
            Event.is_cancelled == False,
            Event.latitude.between(latitude - lat_delta, latitude + lat_delta),
            Event.longitude.between(longitude - lat_delta, longitude + lat_delta),
            Event.start_time >= datetime.utcnow(),
        )
    )
    if event_date:
        q = q.where(func.date(Event.start_time) == event_date)
    if category:
        q = q.where(Event.category == category)

    result = await db.execute(q.limit(limit * 2))
    all_events = result.scalars().all()

    # Filter by exact distance and sort
    nearby = []
    for event in all_events:
        if not event.latitude or not event.longitude:
            continue
        dist = haversine_km(latitude, longitude, event.latitude, event.longitude)
        if dist <= radius_km:
            nearby.append({
                "id": str(event.id),
                "title": event.title,
                "description": event.description,
                "category": event.category,
                "venue": event.venue,
                "address": event.address,
                "distance_km": round(dist, 1),
                "start_time": event.start_time.isoformat(),
                "end_time": event.end_time.isoformat() if event.end_time else None,
                "price": event.price,
                "is_free": event.is_free,
                "image_url": event.image_url,
                "source_url": event.source_url,
                "tags": event.tags or [],
            })

    nearby.sort(key=lambda e: e["distance_km"])
    return {"events": nearby[:limit], "demo": False, "count": len(nearby[:limit])}


@router.get("/categories")
async def get_categories():
    return {
        "categories": [
            {"id": "technology", "name": "Technology", "icon": "💻"},
            {"id": "music", "name": "Music", "icon": "🎵"},
            {"id": "arts", "name": "Arts", "icon": "🎨"},
            {"id": "fitness", "name": "Fitness", "icon": "🏃"},
            {"id": "business", "name": "Business", "icon": "💼"},
            {"id": "food", "name": "Food & Drink", "icon": "🍽️"},
            {"id": "education", "name": "Education", "icon": "📚"},
            {"id": "community", "name": "Community", "icon": "🤝"},
            {"id": "entertainment", "name": "Entertainment", "icon": "🎭"},
            {"id": "other", "name": "Other", "icon": "📌"},
        ]
    }

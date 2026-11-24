"""
Context Engine — assembles a unified context object from all adapters.
The Rule Engine and Scheduler consume this, not individual adapters directly.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any


@dataclass
class UnifiedContext:
    timestamp: datetime
    user_id: str

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None

    # Calendar
    calendar_events: List[Dict] = field(default_factory=list)

    # Fitness
    steps_today: int = 0
    active_minutes_today: int = 0
    distance_km_today: float = 0.0
    workout_completed: bool = False
    workout_type: Optional[str] = None

    # Health
    sleep_duration_minutes: Optional[int] = None
    sleep_quality: Optional[str] = None

    # Weather
    temperature_celsius: Optional[float] = None
    weather_condition: Optional[str] = None
    is_suitable_outdoor: bool = True
    unsuitable_reason: Optional[str] = None
    hourly_weather: List[Dict] = field(default_factory=list)

    # Screen time
    screen_time_total_minutes: int = 0
    screen_time_recreational_minutes: int = 0

    # Tasks
    pending_tasks: List[Dict] = field(default_factory=list)
    current_task: Optional[Dict] = None
    completed_tasks_today: List[Dict] = field(default_factory=list)

    # Time
    available_minutes_today: int = 0
    free_blocks: List[Dict] = field(default_factory=list)

    # Events
    nearby_events: List[Dict] = field(default_factory=list)

    # Data freshness
    calendar_last_synced: Optional[datetime] = None
    fitness_last_synced: Optional[datetime] = None
    weather_last_synced: Optional[datetime] = None
    location_last_updated: Optional[datetime] = None


class ContextEngine:
    """
    Assembles context from all available adapters.
    Adapters are injected so the engine is not tightly coupled to any API.
    """

    def __init__(self, adapters: Dict[str, Any]):
        self.adapters = adapters

    async def build_context(self, user_id: str, user_prefs: Dict) -> UnifiedContext:
        ctx = UnifiedContext(
            timestamp=datetime.utcnow(),
            user_id=user_id,
        )

        # Gather from each adapter independently — failures are silent
        await self._gather_location(ctx, user_prefs)
        await self._gather_calendar(ctx, user_id)
        await self._gather_fitness(ctx, user_id)
        await self._gather_weather(ctx, ctx.latitude, ctx.longitude)
        await self._gather_screen_time(ctx, user_id)
        await self._gather_nearby_events(ctx, user_prefs)

        return ctx

    async def _gather_location(self, ctx: UnifiedContext, prefs: Dict):
        adapter = self.adapters.get("location")
        if not adapter or not prefs.get("location_enabled"):
            return
        try:
            loc = await adapter.get_current_location()
            ctx.latitude = loc.get("latitude")
            ctx.longitude = loc.get("longitude")
            ctx.city = loc.get("city")
            ctx.location_last_updated = datetime.utcnow()
        except Exception:
            pass

    async def _gather_calendar(self, ctx: UnifiedContext, user_id: str):
        adapter = self.adapters.get("calendar")
        if not adapter:
            return
        try:
            events = await adapter.get_today_events(user_id)
            ctx.calendar_events = events
            ctx.calendar_last_synced = datetime.utcnow()
        except Exception:
            pass

    async def _gather_fitness(self, ctx: UnifiedContext, user_id: str):
        adapter = self.adapters.get("fitness")
        if not adapter:
            return
        try:
            data = await adapter.get_today_summary(user_id)
            ctx.steps_today = data.get("steps", 0)
            ctx.active_minutes_today = data.get("active_minutes", 0)
            ctx.distance_km_today = data.get("distance_km", 0.0)
            ctx.workout_completed = data.get("workout_completed", False)
            ctx.workout_type = data.get("workout_type")
            ctx.fitness_last_synced = datetime.utcnow()
        except Exception:
            pass

    async def _gather_weather(self, ctx: UnifiedContext, lat: Optional[float], lon: Optional[float]):
        adapter = self.adapters.get("weather")
        if not adapter or not lat or not lon:
            return
        try:
            data = await adapter.get_weather(lat, lon)
            ctx.temperature_celsius = data.get("temperature_celsius")
            ctx.weather_condition = data.get("condition")
            ctx.is_suitable_outdoor = data.get("is_suitable_outdoor", True)
            ctx.unsuitable_reason = data.get("unsuitable_reason")
            ctx.hourly_weather = data.get("hourly_forecast", [])
            ctx.weather_last_synced = datetime.utcnow()
        except Exception:
            pass

    async def _gather_screen_time(self, ctx: UnifiedContext, user_id: str):
        adapter = self.adapters.get("screen_time")
        if not adapter:
            return
        try:
            data = await adapter.get_today_screen_time(user_id)
            ctx.screen_time_total_minutes = data.get("total_minutes", 0)
            ctx.screen_time_recreational_minutes = data.get("recreational_minutes", 0)
        except Exception:
            pass

    async def _gather_nearby_events(self, ctx: UnifiedContext, prefs: Dict):
        adapter = self.adapters.get("events")
        if not adapter or not ctx.latitude or not ctx.longitude:
            return
        try:
            radius_km = prefs.get("event_discovery_radius_km", 10)
            events = await adapter.get_nearby_events(ctx.latitude, ctx.longitude, radius_km)
            ctx.nearby_events = events
        except Exception:
            pass

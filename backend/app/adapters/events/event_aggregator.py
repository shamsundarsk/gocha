"""
Event Aggregator — fetches, normalizes, deduplicates and stores nearby events.
Pipeline: Fetch → Parse → Normalize → Geocode → Deduplicate → Categorize → Store → Index
"""
import hashlib
import math
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.config import settings


CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "technology": ["tech", "startup", "software", "ai", "code", "hack", "developer", "data", "cloud", "product"],
    "music": ["concert", "music", "band", "festival", "dj", "live", "acoustic", "orchestra", "jazz", "indie"],
    "arts": ["art", "exhibition", "gallery", "museum", "paint", "photo", "design", "film", "theatre", "dance"],
    "fitness": ["run", "yoga", "fitness", "gym", "workout", "marathon", "cycle", "swim", "sport", "football"],
    "business": ["networking", "entrepreneur", "business", "conference", "summit", "workshop", "seminar"],
    "food": ["food", "drink", "restaurant", "chef", "wine", "beer", "culinary", "tasting", "market"],
    "education": ["learn", "class", "course", "lecture", "workshop", "training", "education", "school"],
    "community": ["community", "volunteer", "charity", "social", "meet", "gathering", "club"],
    "entertainment": ["comedy", "game", "quiz", "party", "standup", "improv", "magic", "escape"],
}


class NormalizedEvent:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id") or str(uuid.uuid4())
        self.title: str = kwargs["title"]
        self.description: Optional[str] = kwargs.get("description")
        self.category: Optional[str] = kwargs.get("category")
        self.venue: Optional[str] = kwargs.get("venue")
        self.address: Optional[str] = kwargs.get("address")
        self.city: Optional[str] = kwargs.get("city")
        self.latitude: Optional[float] = kwargs.get("latitude")
        self.longitude: Optional[float] = kwargs.get("longitude")
        self.start_time: datetime = kwargs["start_time"]
        self.end_time: Optional[datetime] = kwargs.get("end_time")
        self.price: Optional[float] = kwargs.get("price")
        self.is_free: bool = kwargs.get("is_free", False)
        self.image_url: Optional[str] = kwargs.get("image_url")
        self.source_url: Optional[str] = kwargs.get("source_url")
        self.source: str = kwargs.get("source", "unknown")
        self.tags: List[str] = kwargs.get("tags", [])

    def dedup_key(self) -> str:
        """Fingerprint for deduplication."""
        raw = f"{self.title.lower().strip()}{self.start_time.date()}{self.venue or ''}"
        return hashlib.md5(raw.encode()).hexdigest()

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "venue": self.venue,
            "address": self.address,
            "city": self.city,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "price": self.price,
            "is_free": self.is_free,
            "image_url": self.image_url,
            "source_url": self.source_url,
            "source": self.source,
            "tags": self.tags,
        }


class EventAggregator:
    """
    Runs the full event pipeline.
    Sources are injected as adapters.
    """

    def __init__(self, source_adapters: List[Any]):
        self.adapters = source_adapters

    async def run_pipeline(self, latitude: float, longitude: float, radius_km: float = 10) -> List[NormalizedEvent]:
        all_raw: List[NormalizedEvent] = []

        for adapter in self.adapters:
            try:
                events = await adapter.fetch(latitude, longitude, radius_km)
                all_raw.extend(events)
            except Exception:
                pass  # Source failure does not break the pipeline

        normalized = [self._normalize(e) for e in all_raw]
        deduplicated = self._deduplicate(normalized)
        categorized = [self._categorize(e) for e in deduplicated]
        filtered = [e for e in categorized if e.latitude and e.longitude]
        return filtered

    def _normalize(self, event: NormalizedEvent) -> NormalizedEvent:
        # Clean title
        if event.title:
            event.title = event.title.strip()
        return event

    def _deduplicate(self, events: List[NormalizedEvent]) -> List[NormalizedEvent]:
        seen = {}
        for event in events:
            key = event.dedup_key()
            if key not in seen:
                seen[key] = event
            else:
                # Merge source references
                existing = seen[key]
                if event.source not in str(existing.source):
                    existing.source = f"{existing.source},{event.source}"
        return list(seen.values())

    def _categorize(self, event: NormalizedEvent) -> NormalizedEvent:
        if event.category:
            return event

        combined = f"{event.title} {event.description or ''} {' '.join(event.tags)}".lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in combined for kw in keywords):
                event.category = category
                return event

        event.category = "other"
        return event


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


class EventbriteAdapter:
    """Eventbrite public API adapter."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.EVENTBRITE_API_KEY

    async def fetch(self, lat: float, lon: float, radius_km: float) -> List[NormalizedEvent]:
        if not self.api_key:
            return []

        url = "https://www.eventbriteapi.com/v3/events/search/"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {
            "location.latitude": lat,
            "location.longitude": lon,
            "location.within": f"{int(radius_km)}km",
            "expand": "venue",
            "sort_by": "date",
        }
        events = []
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                    if resp.status != 200:
                        return []
                    data = await resp.json()
                    for item in data.get("events", []):
                        venue = item.get("venue", {}) or {}
                        address = venue.get("address", {}) or {}
                        start_str = (item.get("start") or {}).get("utc")
                        end_str = (item.get("end") or {}).get("utc")
                        if not start_str:
                            continue
                        from dateutil.parser import parse as dtparse
                        events.append(NormalizedEvent(
                            title=item.get("name", {}).get("text", ""),
                            description=(item.get("description") or {}).get("text", ""),
                            venue=venue.get("name"),
                            address=address.get("localized_address_display"),
                            city=address.get("city"),
                            latitude=float(venue.get("latitude") or 0) or None,
                            longitude=float(venue.get("longitude") or 0) or None,
                            start_time=dtparse(start_str),
                            end_time=dtparse(end_str) if end_str else None,
                            is_free=item.get("is_free", False),
                            image_url=(item.get("logo") or {}).get("url"),
                            source_url=item.get("url"),
                            source="eventbrite",
                            tags=[],
                        ))
        except Exception:
            pass
        return events


class DemoEventAdapter:
    """Returns realistic demo events for a given location."""

    async def fetch(self, lat: float, lon: float, radius_km: float) -> List[NormalizedEvent]:
        from datetime import timedelta
        now = datetime.utcnow()
        return [
            NormalizedEvent(
                title="Design & Innovation Workshop",
                description="Hands-on workshop exploring the intersection of design and technology.",
                category="technology",
                venue="The Innovation Hub",
                city="Demo City",
                latitude=lat + 0.015,
                longitude=lon + 0.012,
                start_time=now.replace(hour=16, minute=0, second=0),
                end_time=now.replace(hour=18, minute=0, second=0),
                is_free=True,
                source="demo",
                tags=["design", "tech", "workshop"],
            ),
            NormalizedEvent(
                title="Startup Networking Meetup",
                description="Meet founders, investors and builders in your city.",
                category="business",
                venue="WeWork Central",
                city="Demo City",
                latitude=lat - 0.020,
                longitude=lon + 0.030,
                start_time=now.replace(hour=18, minute=0, second=0),
                end_time=now.replace(hour=20, minute=30, second=0),
                is_free=False,
                price=5.0,
                source="demo",
                tags=["networking", "startup", "founders"],
            ),
            NormalizedEvent(
                title="Acoustic Evening — Live Music",
                description="Intimate acoustic performance by local artists.",
                category="music",
                venue="The Rooftop Bar",
                city="Demo City",
                latitude=lat + 0.040,
                longitude=lon - 0.025,
                start_time=now.replace(hour=19, minute=30, second=0),
                end_time=now.replace(hour=22, minute=0, second=0),
                is_free=False,
                price=10.0,
                source="demo",
                tags=["music", "acoustic", "live"],
            ),
            NormalizedEvent(
                title="Photography Exhibition — Urban Stories",
                description="A curated exhibition of street photography from local artists.",
                category="arts",
                venue="City Gallery",
                city="Demo City",
                latitude=lat - 0.010,
                longitude=lon - 0.018,
                start_time=now.replace(hour=10, minute=0, second=0),
                end_time=now.replace(hour=20, minute=0, second=0),
                is_free=True,
                source="demo",
                tags=["photography", "art", "exhibition"],
            ),
        ]

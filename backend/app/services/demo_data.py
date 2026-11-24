"""
Demo mode — realistic simulated data for all context sources.
Completely isolated from production data.
"""
from datetime import datetime, timedelta, date, time
from typing import Dict, Any


def get_demo_context(user_id: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    today = now.date()

    return {
        "timestamp": now.isoformat(),
        "user_id": user_id,
        "demo": True,

        # Location: Coimbatore, India
        "latitude": 11.0168,
        "longitude": 76.9558,
        "city": "Coimbatore",

        # Calendar
        "calendar_events": [
            {
                "id": "demo-cal-1",
                "title": "Agency Meeting",
                "start_time": datetime.combine(today, time(15, 0)).isoformat(),
                "end_time": datetime.combine(today, time(16, 0)).isoformat(),
                "location": "Conference Room B",
                "is_all_day": False,
                "is_cancelled": False,
            }
        ],

        # Fitness
        "steps_today": 1240,
        "active_minutes_today": 8,
        "distance_km_today": 0.9,
        "workout_completed": False,

        # Health
        "sleep_duration_minutes": 390,
        "sleep_quality": "fair",

        # Weather — hot afternoon
        "temperature_celsius": 38.5,
        "weather_condition": "Clear sky — Extreme heat",
        "is_suitable_outdoor": False,
        "unsuitable_reason": "Extreme heat (38°C)",
        "hourly_weather": [
            {"time": datetime.combine(today, time(h, 0)).isoformat(), "temp_c": 38 - max(0, h - 14), "condition": "clear"}
            for h in range(12, 20)
        ] + [
            {"time": datetime.combine(today, time(18, 30)).isoformat(), "temp_c": 32, "condition": "clear"},
            {"time": datetime.combine(today, time(19, 0)).isoformat(), "temp_c": 30, "condition": "clear"},
        ],

        # Screen time
        "screen_time_total_minutes": 184,
        "screen_time_recreational_minutes": 48,

        # Available time
        "available_minutes_today": 140,
        "free_blocks": [
            {"start": datetime.combine(today, time(12, 30)).isoformat(), "end": datetime.combine(today, time(14, 30)).isoformat(), "duration_minutes": 120},
            {"start": datetime.combine(today, time(16, 30)).isoformat(), "end": datetime.combine(today, time(18, 0)).isoformat(), "duration_minutes": 90},
        ],

        # Nearby events
        "nearby_events": [
            {
                "id": "demo-evt-1",
                "title": "Design & Innovation Workshop",
                "category": "technology",
                "venue": "The Innovation Hub",
                "distance_km": 2.1,
                "start_time": datetime.combine(today, time(16, 0)).isoformat(),
                "is_free": True,
                "tags": ["design", "tech"],
            },
            {
                "id": "demo-evt-2",
                "title": "Startup Networking Meetup",
                "category": "business",
                "venue": "WeWork Central",
                "distance_km": 3.4,
                "start_time": datetime.combine(today, time(18, 0)).isoformat(),
                "is_free": False,
                "price": 5.0,
                "tags": ["networking", "startup"],
            },
            {
                "id": "demo-evt-3",
                "title": "Acoustic Evening",
                "category": "music",
                "venue": "The Rooftop Bar",
                "distance_km": 5.2,
                "start_time": datetime.combine(today, time(19, 30)).isoformat(),
                "is_free": False,
                "price": 10.0,
                "tags": ["music", "live"],
            },
        ],
    }


def get_demo_schedule() -> list:
    today = datetime.utcnow().date()
    return [
        {
            "id": "demo-task-1",
            "title": "Finish Application",
            "description": "Complete the application form and submit.",
            "category": "work",
            "priority": "high",
            "is_fixed": False,
            "estimated_duration": 90,
            "status": "scheduled",
            "scheduled_start": datetime.combine(today, time(12, 30)).isoformat(),
            "scheduled_end": datetime.combine(today, time(14, 0)).isoformat(),
        },
        {
            "id": "demo-task-cal",
            "title": "Agency Meeting",
            "description": "Team sync at agency.",
            "category": "work",
            "priority": "high",
            "is_fixed": True,
            "fixed_start_time": datetime.combine(today, time(15, 0)).isoformat(),
            "estimated_duration": 60,
            "status": "scheduled",
            "scheduled_start": datetime.combine(today, time(15, 0)).isoformat(),
            "scheduled_end": datetime.combine(today, time(16, 0)).isoformat(),
        },
        {
            "id": "demo-task-2",
            "title": "Learning Session",
            "description": "Upskill — 1 hour of focused learning.",
            "category": "learning",
            "priority": "medium",
            "is_fixed": False,
            "estimated_duration": 60,
            "status": "scheduled",
            "scheduled_start": datetime.combine(today, time(16, 30)).isoformat(),
            "scheduled_end": datetime.combine(today, time(17, 30)).isoformat(),
        },
        {
            "id": "demo-task-3",
            "title": "Evening Run",
            "description": "45 minute run — moved from afternoon due to heat.",
            "category": "fitness",
            "priority": "medium",
            "is_fixed": False,
            "is_outdoor": True,
            "estimated_duration": 45,
            "preferred_time_of_day": "evening",
            "status": "scheduled",
            "scheduled_start": datetime.combine(today, time(18, 30)).isoformat(),
            "scheduled_end": datetime.combine(today, time(19, 15)).isoformat(),
        },
    ]


def get_demo_day_wrapped() -> dict:
    return {
        "date": datetime.utcnow().date().isoformat(),
        "tasks_planned": 4,
        "tasks_completed": 4,
        "tasks_postponed": 0,
        "tasks_abandoned": 0,
        "focus_minutes": 162,
        "screen_time_minutes": 221,
        "steps": 8420,
        "active_minutes": 52,
        "distance_km": 4.2,
        "moments_captured": 5,
        "events_attended": 1,
        "timeline": [
            {"time": "08:40", "label": "Morning", "type": "photo", "icon": "☀️"},
            {"time": "11:20", "label": "Focused Work", "value": "1h 42m", "type": "focus", "icon": "💻"},
            {"time": "15:00", "label": "Agency Meeting", "type": "calendar", "icon": "📅"},
            {"time": "18:20", "label": "Evening Run", "value": "4.2 km", "type": "fitness", "icon": "🏃"},
            {"time": "20:10", "label": "Learning", "value": "58 min", "type": "learning", "icon": "📚"},
        ],
        "highlight_text": "Strong day. All 4 tasks completed. 4.2 km run done.",
    }

"""
Rule-based natural language task parser.
No AI dependency — deterministic pattern matching.
"""
import re
from datetime import date, datetime, timedelta, time
from typing import List, Dict, Any, Optional


DURATION_PATTERNS = [
    (r"(\d+)\s*hour[s]?\s*(?:and\s*)?(\d+)\s*min(?:ute)?s?", lambda m: int(m.group(1)) * 60 + int(m.group(2))),
    (r"(\d+)\s*hour[s]?", lambda m: int(m.group(1)) * 60),
    (r"(\d+)\s*min(?:ute)?s?", lambda m: int(m.group(1))),
    (r"(?:an?|one)\s+hour", lambda m: 60),
    (r"half\s+(?:an?\s+)?hour", lambda m: 30),
]

TIME_PATTERNS = [
    (r"at\s+(\d{1,2}):(\d{2})\s*(am|pm)?", "explicit"),
    (r"at\s+(\d{1,2})\s*(am|pm)", "explicit_hour"),
    (r"(\d{1,2}):(\d{2})\s*(am|pm)", "time_colon"),
    (r"(\d{1,2})\s*(am|pm)", "hour_ampm"),
]

TOD_PATTERNS = {
    "morning": ["morning", "early morning", "in the morning"],
    "afternoon": ["afternoon", "in the afternoon", "midday"],
    "evening": ["evening", "in the evening", "tonight"],
    "night": ["night", "at night", "late"],
}

CATEGORY_KEYWORDS = {
    "fitness": ["run", "running", "jog", "jogging", "gym", "workout", "exercise", "yoga", "swim", "cycling", "walk"],
    "work": ["meeting", "call", "presentation", "report", "review", "email", "project", "work", "application", "proposal"],
    "learning": ["study", "learn", "read", "course", "lecture", "practice", "upskill", "research", "book"],
    "health": ["doctor", "dentist", "medicine", "health", "appointment", "therapy"],
    "personal": ["family", "friend", "dinner", "lunch", "grocery", "shopping", "clean", "cook"],
    "creative": ["write", "design", "draw", "music", "paint", "create", "build", "code"],
    "finance": ["bank", "pay", "invoice", "tax", "budget", "finance"],
}

OUTDOOR_KEYWORDS = ["run", "jog", "walk", "cycle", "outdoor", "park", "field", "gym", "swim"]

PRIORITY_SIGNALS = {
    "critical": ["urgent", "critical", "must", "asap", "immediately"],
    "high": ["important", "priority", "need to", "have to", "deadline"],
    "medium": ["should", "want to", "plan to"],
    "low": ["maybe", "if time", "optional", "perhaps", "can"],
}


def parse_natural_language_tasks(text: str, task_date: Optional[date] = None) -> List[Dict[str, Any]]:
    """
    Parse a natural language string into a list of task dicts.
    Example: "run in the evening, meeting at 3pm, and study for 1 hour"
    """
    if not task_date:
        task_date = date.today() + timedelta(days=1)

    # Split on common separators
    sentences = _split_into_tasks(text)
    tasks = []

    for sentence in sentences:
        if len(sentence.strip()) < 3:
            continue
        task = _parse_single_task(sentence.strip(), task_date)
        if task:
            tasks.append(task)

    return tasks


def _split_into_tasks(text: str) -> List[str]:
    """Split compound sentence into individual task descriptions."""
    # Split on: comma, " and ", semicolon, " then "
    parts = re.split(r",\s*|\band\b|\bthink\b|;\s*|\bthen\b", text, flags=re.IGNORECASE)
    return [p.strip() for p in parts if p.strip()]


def _parse_single_task(text: str, task_date: date) -> Optional[Dict[str, Any]]:
    if not text:
        return None

    title = _clean_title(text)
    if not title:
        return None

    duration = _extract_duration(text) or 30
    fixed_start, is_fixed = _extract_fixed_time(text, task_date)
    preferred_tod = _extract_time_of_day(text)
    category = _detect_category(text)
    priority = _detect_priority(text)
    is_outdoor = any(kw in text.lower() for kw in OUTDOOR_KEYWORDS)

    return {
        "title": title,
        "description": None,
        "date": task_date,
        "estimated_duration": duration,
        "priority": priority,
        "is_fixed": is_fixed,
        "fixed_start_time": fixed_start,
        "preferred_time_of_day": preferred_tod,
        "category": category,
        "is_outdoor": is_outdoor,
        "tags": [],
        "source": "voice_parsed",
        "raw_input": text,
        "status": "planned",
    }


def _clean_title(text: str) -> str:
    """Remove time/duration info from text to get a clean title."""
    cleaned = re.sub(r"\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bfor\s+\d+\s*hour[s]?\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bfor\s+\d+\s*min(ute)?s?\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bin\s+the\s+(morning|afternoon|evening|night)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(tomorrow|today|tonight)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(urgent|important|must|asap)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip().rstrip(",.")
    return cleaned.capitalize() if cleaned else ""


def _extract_duration(text: str) -> Optional[int]:
    for pattern, extractor in DURATION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return extractor(match)
    return None


def _extract_fixed_time(text: str, task_date: date):
    for pattern, pattern_type in TIME_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if not match:
            continue

        try:
            if pattern_type == "explicit":
                hour = int(match.group(1))
                minute = int(match.group(2))
                ampm = (match.group(3) or "").lower()
                hour = _adjust_hour(hour, ampm)
            elif pattern_type == "explicit_hour":
                hour = int(match.group(1))
                ampm = match.group(2).lower()
                hour = _adjust_hour(hour, ampm)
                minute = 0
            elif pattern_type == "time_colon":
                hour = int(match.group(1))
                minute = int(match.group(2))
                ampm = (match.group(3) or "").lower()
                hour = _adjust_hour(hour, ampm)
            else:
                hour = int(match.group(1))
                ampm = match.group(2).lower()
                hour = _adjust_hour(hour, ampm)
                minute = 0

            dt = datetime.combine(task_date, time(hour, minute))
            return dt, True
        except (ValueError, AttributeError):
            continue

    return None, False


def _adjust_hour(hour: int, ampm: str) -> int:
    if ampm == "pm" and hour != 12:
        return hour + 12
    if ampm == "am" and hour == 12:
        return 0
    return hour


def _extract_time_of_day(text: str) -> Optional[str]:
    text_lower = text.lower()
    for tod, keywords in TOD_PATTERNS.items():
        if any(kw in text_lower for kw in keywords):
            return tod
    return None


def _detect_category(text: str) -> str:
    text_lower = text.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return category
    return "other"


def _detect_priority(text: str) -> str:
    text_lower = text.lower()
    for priority, signals in PRIORITY_SIGNALS.items():
        if any(s in text_lower for s in signals):
            return priority
    return "medium"

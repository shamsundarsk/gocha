"""
Insights engine — derives behavioral patterns from actual stored data.
No AI dependency. Minimum data thresholds enforced.
"""
from datetime import date, timedelta
from typing import List, Dict, Any
from collections import defaultdict


MIN_DAYS_FOR_INSIGHT = 7


def generate_insights(wrapped_days: List[Dict]) -> List[Dict[str, Any]]:
    """
    Input: list of DailyWrapped dicts.
    Returns: list of insight objects.
    Only returns insights backed by sufficient data.
    """
    if len(wrapped_days) < MIN_DAYS_FOR_INSIGHT:
        return []

    insights = []
    days_with_tasks = [d for d in wrapped_days if d.get("tasks_planned", 0) > 0]

    if not days_with_tasks:
        return []

    # Completion rate
    completion_rates = [
        d["tasks_completed"] / d["tasks_planned"]
        for d in days_with_tasks
        if d["tasks_planned"] > 0
    ]
    if len(completion_rates) >= 5:
        avg = sum(completion_rates) / len(completion_rates)
        if avg >= 0.8:
            insights.append({
                "type": "completion",
                "emoji": "🎯",
                "text": f"You complete {round(avg * 100)}% of your planned tasks.",
                "confidence": "high",
            })
        elif avg < 0.5:
            insights.append({
                "type": "overplanning",
                "emoji": "📉",
                "text": f"Your completion rate is {round(avg * 100)}%. You may be overplanning each day.",
                "confidence": "medium",
            })

    # Focus time
    focus_days = [d["focus_minutes"] for d in wrapped_days if d.get("focus_minutes", 0) > 0]
    if len(focus_days) >= 5:
        avg_focus = sum(focus_days) / len(focus_days)
        insights.append({
            "type": "focus",
            "emoji": "⏱",
            "text": f"You average {round(avg_focus)} minutes of focused work per day.",
            "confidence": "high",
        })

    # Activity patterns
    active_days = [d for d in wrapped_days if (d.get("distance_km") or 0) > 0.5 or (d.get("active_minutes") or 0) > 15]
    if len(wrapped_days) >= 7:
        active_rate = len(active_days) / len(wrapped_days)
        insights.append({
            "type": "activity",
            "emoji": "🏃",
            "text": f"You were physically active on {round(active_rate * 100)}% of tracked days.",
            "confidence": "high",
        })

    # Postpone pattern
    postponed_counts = [d.get("tasks_postponed", 0) for d in days_with_tasks]
    if len(postponed_counts) >= 7:
        avg_postponed = sum(postponed_counts) / len(postponed_counts)
        if avg_postponed >= 1:
            insights.append({
                "type": "postpone",
                "emoji": "⏭",
                "text": f"You postpone {avg_postponed:.1f} tasks per day on average.",
                "confidence": "medium",
            })

    # Screen time
    screen_days = [d for d in wrapped_days if (d.get("screen_time_minutes") or 0) > 180]
    if len(wrapped_days) >= 7 and len(screen_days) > len(wrapped_days) * 0.5:
        insights.append({
            "type": "screen_time",
            "emoji": "📱",
            "text": "More than half your days had over 3 hours of screen time.",
            "confidence": "medium",
        })

    return insights

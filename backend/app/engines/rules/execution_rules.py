"""
Rule-based Execution Engine.
Deterministic rules — no AI dependency.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum


class RuleTrigger(str, Enum):
    TASK_FIXED = "task_is_fixed"
    TASK_FLEXIBLE = "task_is_flexible"
    DEADLINE_APPROACHING = "deadline_approaching"
    TASK_OVERDUE = "task_overdue"
    USER_WOKE_LATE = "user_woke_late"
    TASK_EXCEEDS_ESTIMATE = "task_exceeds_estimate"
    OUTDOOR_UNSUITABLE_WEATHER = "outdoor_unsuitable_weather"
    USER_NEAR_TASK_LOCATION = "user_near_task_location"
    USER_HAS_FREE_TIME = "user_has_free_time"
    HIGH_PRIORITY_WAITING = "high_priority_waiting"
    EXCESSIVE_SCREEN_TIME = "excessive_screen_time"
    CALENDAR_CHANGED = "calendar_changed"
    USER_INACTIVE = "user_inactive"
    TASK_COMPLETED_EARLY = "task_completed_early"


@dataclass
class RuleContext:
    """Snapshot of everything the rule engine needs to decide."""
    now: datetime
    user_wake_time: datetime
    user_sleep_time: datetime

    # Tasks
    pending_tasks: list
    current_task: Optional[dict]

    # Context signals
    weather_suitable_outdoor: bool = True
    weather_unsuitable_reason: Optional[str] = None
    hourly_weather: Optional[list] = None

    screen_time_recreational_minutes: int = 0
    screen_time_threshold_minutes: int = 45
    last_notification_at: Optional[datetime] = None
    notification_cooldown_minutes: int = 30

    user_latitude: Optional[float] = None
    user_longitude: Optional[float] = None

    calendar_events: Optional[list] = None

    activity_today_minutes: int = 0
    steps_today: int = 0

    # Computed by scheduler
    free_blocks: Optional[list] = None


@dataclass
class RuleAction:
    rule: str
    action_type: str  # reschedule, lock, increase_priority, nudge, surface_task, suggest_free_time
    task_id: Optional[str] = None
    new_time: Optional[datetime] = None
    message: Optional[str] = None
    priority: int = 5  # 1 = highest


class ExecutionRuleEngine:
    """
    Pure deterministic rule engine.
    Evaluates context and returns a list of actions.
    """

    OUTDOOR_HEAT_THRESHOLD_C = 36.0
    OUTDOOR_RAIN_CONDITIONS = {"rain", "thunderstorm", "drizzle", "snow"}
    NEARBY_LOCATION_THRESHOLD_KM = 1.0
    OVERDUE_GRACE_MINUTES = 15

    def evaluate(self, ctx: RuleContext) -> List[RuleAction]:
        actions: List[RuleAction] = []

        actions.extend(self._rule_lock_fixed_tasks(ctx))
        actions.extend(self._rule_deadline_approaching(ctx))
        actions.extend(self._rule_overdue_tasks(ctx))
        actions.extend(self._rule_outdoor_weather(ctx))
        actions.extend(self._rule_screen_time_nudge(ctx))
        actions.extend(self._rule_location_relevance(ctx))
        actions.extend(self._rule_free_time(ctx))
        actions.extend(self._rule_user_inactive(ctx))
        actions.extend(self._rule_high_priority_waiting(ctx))

        # Sort by priority
        actions.sort(key=lambda a: a.priority)
        return actions

    def _rule_lock_fixed_tasks(self, ctx: RuleContext) -> List[RuleAction]:
        actions = []
        for task in ctx.pending_tasks:
            if task.get("is_fixed") and task.get("fixed_start_time"):
                actions.append(RuleAction(
                    rule=RuleTrigger.TASK_FIXED,
                    action_type="lock",
                    task_id=task["id"],
                    priority=1,
                ))
        return actions

    def _rule_deadline_approaching(self, ctx: RuleContext) -> List[RuleAction]:
        actions = []
        for task in ctx.pending_tasks:
            deadline = task.get("deadline")
            if not deadline:
                continue
            if isinstance(deadline, str):
                from dateutil.parser import parse
                deadline = parse(deadline)
            hours_remaining = (deadline - ctx.now).total_seconds() / 3600
            if 0 < hours_remaining <= 2:
                actions.append(RuleAction(
                    rule=RuleTrigger.DEADLINE_APPROACHING,
                    action_type="increase_priority",
                    task_id=task["id"],
                    message=f"Deadline in {int(hours_remaining * 60)} minutes.",
                    priority=2,
                ))
        return actions

    def _rule_overdue_tasks(self, ctx: RuleContext) -> List[RuleAction]:
        actions = []
        for task in ctx.pending_tasks:
            scheduled = task.get("scheduled_start")
            if not scheduled:
                continue
            if isinstance(scheduled, str):
                from dateutil.parser import parse
                scheduled = parse(scheduled)
            overdue_minutes = (ctx.now - scheduled).total_seconds() / 60
            if overdue_minutes > self.OVERDUE_GRACE_MINUTES:
                actions.append(RuleAction(
                    rule=RuleTrigger.TASK_OVERDUE,
                    action_type="reschedule",
                    task_id=task["id"],
                    message=f"Task is {int(overdue_minutes)} min overdue.",
                    priority=2,
                ))
        return actions

    def _rule_outdoor_weather(self, ctx: RuleContext) -> List[RuleAction]:
        actions = []
        if ctx.weather_suitable_outdoor:
            return actions

        for task in ctx.pending_tasks:
            if not task.get("is_outdoor") or not task.get("is_fixed") is False:
                continue

            best_time = self._find_suitable_outdoor_time(ctx)
            actions.append(RuleAction(
                rule=RuleTrigger.OUTDOOR_UNSUITABLE_WEATHER,
                action_type="reschedule",
                task_id=task["id"],
                new_time=best_time,
                message=f"Moved due to weather: {ctx.weather_unsuitable_reason}. "
                        f"Suitable after {best_time.strftime('%I:%M %p') if best_time else 'later'}.",
                priority=3,
            ))
        return actions

    def _find_suitable_outdoor_time(self, ctx: RuleContext) -> Optional[datetime]:
        """Walk the hourly forecast to find a suitable window."""
        if not ctx.hourly_weather:
            # Default: evening
            return ctx.now.replace(hour=18, minute=30, second=0, microsecond=0)

        for hour_data in ctx.hourly_weather:
            temp = hour_data.get("temp_c", 30)
            condition = hour_data.get("condition", "").lower()
            hour_time = hour_data.get("time")
            if isinstance(hour_time, str):
                from dateutil.parser import parse
                hour_time = parse(hour_time)

            if hour_time <= ctx.now:
                continue

            is_rain = any(r in condition for r in self.OUTDOOR_RAIN_CONDITIONS)
            if temp <= self.OUTDOOR_HEAT_THRESHOLD_C and not is_rain:
                return hour_time

        return None

    def _rule_screen_time_nudge(self, ctx: RuleContext) -> List[RuleAction]:
        if ctx.screen_time_recreational_minutes < ctx.screen_time_threshold_minutes:
            return []

        # Respect notification cooldown
        if ctx.last_notification_at:
            elapsed = (ctx.now - ctx.last_notification_at).total_seconds() / 60
            if elapsed < ctx.notification_cooldown_minutes:
                return []

        # Only nudge if there's a pending high-priority task
        high_priority_pending = [
            t for t in ctx.pending_tasks
            if t.get("priority") in ("high", "critical") and t.get("status") in ("planned", "scheduled")
        ]
        if not high_priority_pending:
            return []

        task = high_priority_pending[0]
        return [RuleAction(
            rule=RuleTrigger.EXCESSIVE_SCREEN_TIME,
            action_type="nudge",
            task_id=task["id"],
            message=(
                f"You've been scrolling for {ctx.screen_time_recreational_minutes} minutes. "
                f"'{task['title']}' is still waiting."
            ),
            priority=4,
        )]

    def _rule_location_relevance(self, ctx: RuleContext) -> List[RuleAction]:
        if not ctx.user_latitude or not ctx.user_longitude:
            return []

        actions = []
        for task in ctx.pending_tasks:
            task_lat = task.get("location_latitude")
            task_lon = task.get("location_longitude")
            if not task_lat or not task_lon:
                continue

            dist = self._haversine(ctx.user_latitude, ctx.user_longitude, task_lat, task_lon)
            if dist <= self.NEARBY_LOCATION_THRESHOLD_KM:
                actions.append(RuleAction(
                    rule=RuleTrigger.USER_NEAR_TASK_LOCATION,
                    action_type="surface_task",
                    task_id=task["id"],
                    message=f"You're near '{task['title']}' ({dist:.1f} km away).",
                    priority=3,
                ))
        return actions

    def _rule_free_time(self, ctx: RuleContext) -> List[RuleAction]:
        if not ctx.free_blocks:
            return []

        significant_blocks = [b for b in ctx.free_blocks if b.get("duration_minutes", 0) >= 30]
        if not significant_blocks:
            return []

        pending = [t for t in ctx.pending_tasks if t.get("status") in ("planned", "scheduled")]
        if not pending:
            return []

        block = significant_blocks[0]
        return [RuleAction(
            rule=RuleTrigger.USER_HAS_FREE_TIME,
            action_type="suggest_free_time",
            message=f"You have {block['duration_minutes']} free minutes. "
                    f"Suggested: {pending[0]['title']}.",
            priority=5,
        )]

    def _rule_user_inactive(self, ctx: RuleContext) -> List[RuleAction]:
        if ctx.activity_today_minutes >= 20 or ctx.steps_today >= 3000:
            return []

        # Only after midday
        if ctx.now.hour < 12:
            return []

        fitness_tasks = [
            t for t in ctx.pending_tasks
            if t.get("category") == "fitness" and t.get("status") in ("planned", "scheduled")
        ]
        if fitness_tasks:
            return []  # Already planned

        return [RuleAction(
            rule=RuleTrigger.USER_INACTIVE,
            action_type="surface_task",
            message="You've been inactive today. A short walk is still possible.",
            priority=5,
        )]

    def _rule_high_priority_waiting(self, ctx: RuleContext) -> List[RuleAction]:
        critical = [
            t for t in ctx.pending_tasks
            if t.get("priority") == "critical" and t.get("status") in ("planned", "scheduled")
        ]
        if not critical:
            return []

        return [RuleAction(
            rule=RuleTrigger.HIGH_PRIORITY_WAITING,
            action_type="increase_priority",
            task_id=critical[0]["id"],
            message=f"Critical task waiting: '{critical[0]['title']}'.",
            priority=1,
        )]

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Distance in km between two coordinates."""
        import math
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        return R * 2 * math.asin(math.sqrt(a))

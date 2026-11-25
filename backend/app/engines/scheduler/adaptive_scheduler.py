"""
Adaptive Scheduler — rebuilds the day's schedule deterministically
whenever context changes.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta, time
from typing import List, Optional, Dict, Any
import uuid


@dataclass
class ScheduledBlock:
    id: str
    task_id: Optional[str]
    calendar_event_id: Optional[str]
    title: str
    start: datetime
    end: datetime
    block_type: str  # task, calendar, buffer, free
    is_fixed: bool = False
    is_moveable: bool = True
    priority: str = "medium"
    color: Optional[str] = None


@dataclass
class SchedulerInput:
    user_id: str
    date: datetime
    wake_time: time
    sleep_time: time
    tasks: List[Dict[str, Any]]
    calendar_events: List[Dict[str, Any]]
    current_time: datetime
    timezone: str = "UTC"
    buffer_minutes: int = 10  # between blocks


class AdaptiveScheduler:
    """
    Builds and rebuilds the day's schedule.
    Rules:
    - Fixed tasks and calendar events are immovable.
    - Flexible tasks fill remaining free windows in priority order.
    - After any context change, the remaining day is recalculated.
    """

    def build_schedule(self, inp: SchedulerInput) -> List[ScheduledBlock]:
        blocks: List[ScheduledBlock] = []

        # 1. Add fixed calendar events
        for event in inp.calendar_events:
            if event.get("is_cancelled"):
                continue
            blocks.append(ScheduledBlock(
                id=str(uuid.uuid4()),
                task_id=None,
                calendar_event_id=event["id"],
                title=event["title"],
                start=self._parse_dt(event["start_time"]),
                end=self._parse_dt(event["end_time"]),
                block_type="calendar",
                is_fixed=True,
                is_moveable=False,
                color="#0A84FF",
            ))

        # 2. Add fixed tasks
        for task in inp.tasks:
            if task.get("is_fixed") and task.get("fixed_start_time"):
                start = self._parse_dt(task["fixed_start_time"])
                end = start + timedelta(minutes=task.get("estimated_duration", 60))
                blocks.append(ScheduledBlock(
                    id=str(uuid.uuid4()),
                    task_id=task["id"],
                    calendar_event_id=None,
                    title=task["title"],
                    start=start,
                    end=end,
                    block_type="task",
                    is_fixed=True,
                    is_moveable=False,
                    priority=task.get("priority", "medium"),
                    color=self._priority_color(task.get("priority", "medium")),
                ))

        # Sort all fixed blocks by start time
        blocks.sort(key=lambda b: b.start)

        # 3. Build free windows
        day_start = datetime.combine(inp.date.date(), inp.wake_time)
        # For today, start from current time if past wake time
        if inp.date.date() == inp.current_time.date() and inp.current_time > day_start:
            day_start = inp.current_time + timedelta(minutes=5)

        day_end = datetime.combine(inp.date.date(), inp.sleep_time)
        free_windows = self._compute_free_windows(blocks, day_start, day_end, inp.buffer_minutes)

        # 4. Schedule flexible tasks into free windows
        flexible_tasks = [
            t for t in inp.tasks
            if not t.get("is_fixed")
            and t.get("status") not in ("completed", "cancelled", "abandoned")
        ]
        # Sort: critical > high > medium > low, then by deadline
        flexible_tasks.sort(key=lambda t: (
            self._priority_rank(t.get("priority", "medium")),
            t.get("deadline") or "9999",
        ))

        for task in flexible_tasks:
            duration = timedelta(minutes=task.get("estimated_duration", 30))
            preferred_tod = task.get("preferred_time_of_day")

            # Try preferred time of day first
            window = self._find_window(free_windows, duration, preferred_tod, inp.date)
            if not window:
                window = self._find_window(free_windows, duration, None, inp.date)

            if not window:
                continue  # No room today

            start = window[0]
            end = start + duration

            blocks.append(ScheduledBlock(
                id=str(uuid.uuid4()),
                task_id=task["id"],
                calendar_event_id=None,
                title=task["title"],
                start=start,
                end=end,
                block_type="task",
                is_fixed=False,
                is_moveable=True,
                priority=task.get("priority", "medium"),
                color=self._priority_color(task.get("priority", "medium")),
            ))

            # Update free windows
            free_windows = self._remove_from_windows(free_windows, start, end + timedelta(minutes=inp.buffer_minutes))

        blocks.sort(key=lambda b: b.start)
        return blocks

    def get_next_action(self, blocks: List[ScheduledBlock], now: datetime) -> Optional[ScheduledBlock]:
        """Return the most immediate pending block."""
        for block in blocks:
            if block.start >= now:
                return block
            if block.start <= now < block.end:
                return block
        return None

    def get_free_time_today(self, blocks: List[ScheduledBlock], now: datetime, sleep_time: time) -> int:
        """Total free minutes remaining today."""
        day_end = datetime.combine(now.date(), sleep_time)
        windows = self._compute_free_windows(blocks, now, day_end, 0)
        return sum(int((w[1] - w[0]).total_seconds() / 60) for w in windows)

    def _compute_free_windows(
        self,
        fixed_blocks: List[ScheduledBlock],
        day_start: datetime,
        day_end: datetime,
        buffer_minutes: int,
    ) -> List[tuple]:
        """Return list of (start, end) free windows."""
        fixed = sorted(
            [b for b in fixed_blocks],
            key=lambda b: b.start,
        )

        windows = []
        cursor = day_start

        for block in fixed:
            block_start = block.start - timedelta(minutes=buffer_minutes)
            if cursor < block_start:
                windows.append((cursor, block_start))
            cursor = max(cursor, block.end + timedelta(minutes=buffer_minutes))

        if cursor < day_end:
            windows.append((cursor, day_end))

        return windows

    def _find_window(
        self,
        windows: List[tuple],
        duration: timedelta,
        preferred_tod: Optional[str],
        date: datetime,
    ) -> Optional[tuple]:
        """Find a window that fits the duration, respecting preferred time of day."""
        tod_start, tod_end = self._tod_range(preferred_tod, date)

        # First pass: preferred time
        if preferred_tod:
            for w_start, w_end in windows:
                # Clamp to preferred range
                start = max(w_start, tod_start)
                end = min(w_end, tod_end)
                if end - start >= duration:
                    return (start, end)

        # Second pass: any window
        for w_start, w_end in windows:
            if w_end - w_start >= duration:
                return (w_start, w_end)

        return None

    def _remove_from_windows(self, windows: List[tuple], used_start: datetime, used_end: datetime) -> List[tuple]:
        new_windows = []
        for w_start, w_end in windows:
            if used_end <= w_start or used_start >= w_end:
                new_windows.append((w_start, w_end))
            else:
                if w_start < used_start:
                    new_windows.append((w_start, used_start))
                if used_end < w_end:
                    new_windows.append((used_end, w_end))
        return new_windows

    def _tod_range(self, tod: Optional[str], date: datetime):
        d = date.date()
        ranges = {
            "morning": (datetime.combine(d, time(6, 0)), datetime.combine(d, time(12, 0))),
            "afternoon": (datetime.combine(d, time(12, 0)), datetime.combine(d, time(17, 0))),
            "evening": (datetime.combine(d, time(17, 0)), datetime.combine(d, time(22, 0))),
            "night": (datetime.combine(d, time(20, 0)), datetime.combine(d, time(23, 59))),
        }
        return ranges.get(tod, (datetime.combine(d, time(6, 0)), datetime.combine(d, time(23, 59))))

    @staticmethod
    def _priority_rank(priority: str) -> int:
        return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(priority, 2)

    @staticmethod
    def _priority_color(priority: str) -> str:
        return {
            "critical": "#FF453A",
            "high": "#FF9F0A",
            "medium": "#0A84FF",
            "low": "#8E8E93",
        }.get(priority, "#0A84FF")

    @staticmethod
    def _parse_dt(value) -> datetime:
        if isinstance(value, datetime):
            return value
        from dateutil.parser import parse
        return parse(str(value))

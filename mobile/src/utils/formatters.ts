import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isValid } from 'date-fns';

/** Parse a date string safely. Returns null if invalid. */
export function safeDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

/** Format a date string safely. Returns fallback if invalid. */
export function safeFormat(value: string | undefined | null, fmt: string, fallback = '--'): string {
  const d = safeDate(value);
  if (!d) return fallback;
  try {
    return format(d, fmt);
  } catch {
    return fallback;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes < 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatRelativeDate(dateStr: string): string {
  const d = safeDate(dateStr);
  if (!d) return '--';
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

export function formatTime(dateStr: string | undefined | null): string {
  return safeFormat(dateStr, 'h:mm a');
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatMinutesUntil(dateStr: string): string {
  const d = safeDate(dateStr);
  if (!d) return '--';
  const now = new Date();
  const diff = Math.round((d.getTime() - now.getTime()) / 60000);
  if (diff <= 0) return 'now';
  if (diff < 60) return `in ${diff}m`;
  return `in ${Math.floor(diff / 60)}h ${diff % 60 > 0 ? `${diff % 60}m` : ''}`.trim();
}

export function blockDurationMins(start: string | undefined, end: string | undefined): number {
  const s = safeDate(start);
  const e = safeDate(end);
  if (!s || !e) return 0;
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    work: '#0A84FF', fitness: '#30D158', health: '#FF453A',
    learning: '#FF9F0A', personal: '#BF5AF2', social: '#FF375F',
    errands: '#8E8E93', creative: '#64D2FF', finance: '#30D158', other: '#636366',
  };
  return map[category] || '#636366';
}

export function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    work: '💼', fitness: '🏃', health: '❤️', learning: '📚',
    personal: '🏠', social: '👥', errands: '📋', creative: '🎨',
    finance: '💰', other: '📌',
  };
  return map[category] || '📌';
}

export function fmt(mins?: number): string {
  if (!mins) return '—';
  if (mins < 60) return '${mins}m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? '${h}h ${m}m' : '${h}h';
}

export function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    critical: '#FF453A', high: '#FF9F0A', medium: '#0A84FF', low: '#8E8E93',
  };
  return map[priority] || '#0A84FF';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface UserPreferences {
  wake_time: string;
  sleep_time: string;
  work_start: string;
  work_end: string;
  interests: string[];
  notification_style: 'minimal' | 'balanced' | 'proactive';
  notification_cooldown_minutes: number;
  calendar_connected: boolean;
  calendar_provider?: string;
  fitness_connected: boolean;
  fitness_provider?: string;
  location_enabled: boolean;
  photos_enabled: boolean;
  screen_time_enabled: boolean;
  event_discovery_radius_km: number;
  timezone: string;
  demo_mode: boolean;
}

export type TaskStatus =
  | 'planned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'cancelled'
  | 'abandoned';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskCategory =
  | 'work'
  | 'fitness'
  | 'health'
  | 'learning'
  | 'personal'
  | 'social'
  | 'errands'
  | 'creative'
  | 'finance'
  | 'other';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date?: string;
  deadline?: string;
  estimated_duration: number;
  actual_duration?: number;
  priority: TaskPriority;
  is_fixed: boolean;
  fixed_start_time?: string;
  preferred_time_of_day?: string;
  location?: string;
  is_outdoor: boolean;
  category: TaskCategory;
  tags: string[];
  status: TaskStatus;
  scheduled_start?: string;
  scheduled_end?: string;
  started_at?: string;
  completed_at?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  task_id?: string;
  calendar_event_id?: string;
  title: string;
  start: string;
  end: string;
  block_type: 'task' | 'calendar' | 'buffer' | 'free';
  is_fixed: boolean;
  priority: TaskPriority;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day: boolean;
  is_cancelled: boolean;
}

export interface NearbyEvent {
  id: string;
  title: string;
  description?: string;
  category: string;
  venue?: string;
  address?: string;
  distance_km: number;
  start_time: string;
  end_time?: string;
  price?: number;
  is_free: boolean;
  image_url?: string;
  source_url?: string;
  tags: string[];
}

export interface UnifiedContext {
  timestamp: string;
  user_id: string;
  demo?: boolean;
  latitude?: number;
  longitude?: number;
  city?: string;
  calendar_events: CalendarEvent[];
  steps_today: number;
  active_minutes_today: number;
  distance_km_today: number;
  workout_completed: boolean;
  workout_type?: string;
  sleep_duration_minutes?: number;
  temperature_celsius?: number;
  weather_condition?: string;
  is_suitable_outdoor: boolean;
  unsuitable_reason?: string;
  screen_time_total_minutes: number;
  screen_time_recreational_minutes: number;
  pending_tasks: Task[];
  current_task?: Task;
  completed_tasks_today: Task[];
  available_minutes_today: number;
  free_blocks: Array<{ start: string; end: string; duration_minutes: number }>;
  nearby_events: NearbyEvent[];
}

export interface TimelineItem {
  time: string;
  label: string;
  type: string;
  icon: string;
  value?: string;
}

export interface DayWrapped {
  date: string;
  tasks_planned: number;
  tasks_completed: number;
  tasks_postponed: number;
  tasks_abandoned: number;
  focus_minutes: number;
  screen_time_minutes?: number;
  steps?: number;
  active_minutes?: number;
  distance_km?: number;
  moments_captured: number;
  events_attended: number;
  timeline: TimelineItem[];
  highlight_text: string;
  is_generated: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

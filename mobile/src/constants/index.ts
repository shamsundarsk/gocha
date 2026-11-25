export { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from './theme';

// iOS Simulator and physical devices can't reach "localhost".
// In Expo Go, Constants.expoConfig.hostUri gives us the Metro host IP,
// which is the same machine running the backend. Fall back to hardcoded LAN IP.
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiBaseUrl = (): string => {
  if (!__DEV__) return 'https://api.gocha.app/api/v1';

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname || 'localhost'}:8000/api/v1`;
  }

  // iOS Simulator can reach the host machine through localhost.
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return 'http://localhost:8000/api/v1';
  }

  const hostUri = Constants.expoConfig?.hostUri;          // e.g. "192.168.29.69:8081"
  if (hostUri) {
    const host = hostUri.split(':')[0];                   // "192.168.29.69"
    return `http://${host}:8000/api/v1`;
  }
  return 'http://localhost:8000/api/v1';                  // fallback
};

export const API_BASE_URL = getApiBaseUrl();

export const TASK_STATUSES = {
  PLANNED: 'planned',
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  ABANDONED: 'abandoned',
} as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export const TASK_CATEGORIES = [
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'health', label: 'Health', emoji: '❤️' },
  { id: 'learning', label: 'Learning', emoji: '📚' },
  { id: 'personal', label: 'Personal', emoji: '🏠' },
  { id: 'social', label: 'Social', emoji: '👥' },
  { id: 'errands', label: 'Errands', emoji: '📋' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'other', label: 'Other', emoji: '📌' },
] as const;

export const TIME_OF_DAY = [
  { id: 'morning', label: 'Morning', range: '6–12 AM', emoji: '🌅' },
  { id: 'afternoon', label: 'Afternoon', range: '12–5 PM', emoji: '☀️' },
  { id: 'evening', label: 'Evening', range: '5–10 PM', emoji: '🌆' },
  { id: 'night', label: 'Night', range: '10 PM+', emoji: '🌙' },
] as const;

export const NOTIFICATION_COOLDOWN_DEFAULT = 30; // minutes

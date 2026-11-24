import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// Global error normalizer
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ detail: string }>) => {
    const message = error.response?.data?.detail || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// --- Auth ---
export const authApi = {
  register: (email: string, password: string, fullName: string) =>
    api.post('/auth/register', { email, password, full_name: fullName }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),
};

// --- Tasks ---
export const tasksApi = {
  list: (params?: { task_date?: string; status?: string }) =>
    api.get('/tasks', { params }),

  create: (data: object) => api.post('/tasks', data),

  parse: (text: string, date?: string) =>
    api.post('/tasks/parse', { text, date }),

  get: (id: string) => api.get(`/tasks/${id}`),

  update: (id: string, data: object) => api.patch(`/tasks/${id}`, data),

  updateStatus: (id: string, status: string, actual_duration?: number, note?: string) =>
    api.patch(`/tasks/${id}/status`, { status, actual_duration, note }),

  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// --- Schedule ---
export const scheduleApi = {
  get: (date: string) => api.get(`/schedule/${date}`),
  recalculate: (date: string) => api.post(`/schedule/${date}/recalculate`),
};

// --- Context ---
export const contextApi = {
  getCurrent: () => api.get('/context/current'),
  updateLocation: (lat: number, lon: number) =>
    api.post('/context/location', null, { params: { latitude: lat, longitude: lon } }),
  updateScreenTime: (total: number, recreational: number) =>
    api.post('/context/screen-time', null, { params: { total_minutes: total, recreational_minutes: recreational } }),
};

// --- Events ---
export const eventsApi = {
  getNearby: (params: { latitude: number; longitude: number; radius_km?: number; category?: string }) =>
    api.get('/events/nearby', { params }),
  getCategories: () => api.get('/events/categories'),
};

// --- Wrapped ---
export const wrappedApi = {
  getDay: (date: string) => api.get(`/wrapped/day/${date}`),
};

// --- User ---
export const userApi = {
  me: () => api.get('/user/me'),
  getPreferences: () => api.get('/user/preferences'),
  updatePreferences: (data: object) => api.patch('/user/preferences', data),
};

export default api;

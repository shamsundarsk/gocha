import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { Task } from '@/types';
import {
  LatLng,
  destinationPoint,
  haversineMeters,
  hashString,
  clamp,
} from '@/utils/geo';

const MISSIONS_FILE = 'gocha-missions.json';

export interface Mission {
  taskId: string;
  title: string;
  category: string;
  icon: string;
  placeName: string;
  destination: LatLng;
  radiusMeters: number;
  lockedAt: string;
  startDistanceMeters: number;
  photoUri?: string;
  photoCaption?: string;
  capturedAt?: string;
  completed: boolean;
}

interface PersistedMissions {
  missions: Record<string, Mission>;
  dismissedTaskIds: string[];
}

interface MissionStore {
  missions: Record<string, Mission>;
  dismissedTaskIds: string[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  ensureMissions: (tasks: Task[], origin: LatLng) => void;
  createMission: (task: Task, origin: LatLng, placeName?: string) => Mission | null;
  relockMission: (task: Task, origin: LatLng, placeName?: string) => Mission | null;
  resetMission: (taskId: string) => void;
  capturePhoto: (taskId: string, uri: string, caption?: string) => Promise<void>;
  getMission: (taskId?: string | null) => Mission | undefined;
}

const PLACE_TEMPLATES = [
  { name: 'Riverside Trail', icon: 'leaf', kind: 'trail', distance: 900, bearing: 12 },
  { name: 'City Sports Track', icon: 'stadium', kind: 'track', distance: 1150, bearing: 74 },
  { name: 'Hill View Loop', icon: 'mountain', kind: 'trail', distance: 1450, bearing: 142 },
  { name: 'Neighbourhood Park', icon: 'leaf', kind: 'park', distance: 520, bearing: 208 },
  { name: 'The Corner Cafe', icon: 'cafe', kind: 'cafe', distance: 380, bearing: 296 },
  { name: 'Local Market', icon: 'cart', kind: 'market', distance: 760, bearing: 252 },
  { name: 'Town Gym', icon: 'barbell', kind: 'gym', distance: 620, bearing: 34 },
  { name: 'Lake Promenade', icon: 'water', kind: 'trail', distance: 1250, bearing: 318 },
];

const CATEGORY_ICON: Record<string, string> = {
  fitness: 'barbell',
  health: 'heart',
  errands: 'cart',
  social: 'people',
  personal: 'home',
  other: 'ellipse',
  work: 'briefcase',
  learning: 'book',
  creative: 'color-palette',
  finance: 'wallet',
};

function isOutdoorTask(task: Task): boolean {
  if (task.is_outdoor) return true;
  if (['cancelled', 'completed', 'abandoned'].includes(task.status)) return false;

  const haystack = `${task.title} ${task.location || ''}`.toLowerCase();
  const keywords = [
    'run',
    'jog',
    'walk',
    'cycle',
    'bike',
    'hike',
    'trail',
    'park',
    'gym',
    'workout',
    'market',
    'store',
    'grocer',
    'pick up',
    'drop',
    'deliver',
    'coffee',
    'cafe',
    'outside',
    'outdoor',
    'field',
    'track',
  ];

  if (keywords.some((word) => haystack.includes(word))) return true;
  return ['fitness', 'errands'].includes(task.category);
}

function chooseTemplate(task: Task) {
  const haystack = `${task.title} ${task.location || ''}`.toLowerCase();
  const matching = PLACE_TEMPLATES.filter((template) => {
    if (/run|jog|trail|hike/.test(haystack)) {
      return ['trail', 'track', 'park'].includes(template.kind);
    }
    if (/walk|park/.test(haystack)) return template.kind === 'park';
    if (/gym|workout|lift/.test(haystack)) return template.kind === 'gym';
    if (/cycle|bike|loop/.test(haystack)) return ['trail', 'track'].includes(template.kind);
    if (/coffee|cafe|friend/.test(haystack)) return template.kind === 'cafe';
    if (/buy|grocer|market|store|pick|drop|deliver|errand/.test(haystack)) {
      return template.kind === 'market';
    }
    return true;
  });

  const pool = matching.length > 0 ? matching : PLACE_TEMPLATES;
  const seed = hashString(`${task.id}:${task.title}`);
  return pool[seed % pool.length];
}

function buildMission(task: Task, origin: LatLng, placeName?: string): Mission {
  const template = chooseTemplate(task);
  const seed = hashString(`${task.id}:${task.title}:${task.category}`);
  const distance = clamp(template.distance + (seed % 260) - 120, 280, 1800);
  const bearing = (seed % 360 + template.bearing) % 360;
  const destination = destinationPoint(origin, distance, bearing);

  return {
    taskId: task.id,
    title: task.title,
    category: task.category,
    icon: CATEGORY_ICON[task.category] || 'flag',
    placeName: placeName || task.location || template.name,
    destination,
    radiusMeters: template.kind === 'market' ? 180 : 130,
    lockedAt: new Date().toISOString(),
    startDistanceMeters: Math.round(haversineMeters(origin, destination)),
    completed: false,
  };
}

async function persist(missions: Record<string, Mission>, dismissedTaskIds: string[]) {
  if (!FileSystem.documentDirectory) return;
  try {
    const payload: PersistedMissions = { missions, dismissedTaskIds };
    await FileSystem.writeAsStringAsync(
      `${FileSystem.documentDirectory}${MISSIONS_FILE}`,
      JSON.stringify(payload)
    );
  } catch {}
}

async function savePhotoCopy(taskId: string, uri: string): Promise<string> {
  if (!FileSystem.documentDirectory) return uri;
  try {
    const dir = `${FileSystem.documentDirectory}moments/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const target = `${dir}${taskId}-${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: target });
    return target;
  } catch {
    return uri;
  }
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  missions: {},
  dismissedTaskIds: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      if (FileSystem.documentDirectory) {
        const path = `${FileSystem.documentDirectory}${MISSIONS_FILE}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(path);
          const parsed: PersistedMissions = JSON.parse(raw);
          set({
            missions: parsed.missions || {},
            dismissedTaskIds: parsed.dismissedTaskIds || [],
            hydrated: true,
          });
          return;
        }
      }
    } catch {}
    set({ hydrated: true });
  },

  ensureMissions: (tasks, origin) => {
    if (!origin || !Number.isFinite(origin.latitude) || !Number.isFinite(origin.longitude)) {
      return;
    }

    const { missions, dismissedTaskIds } = get();
    const next = { ...missions };
    let changed = false;

    for (const task of tasks) {
      if (Object.keys(next).length >= 12) break;
      if (!isOutdoorTask(task)) continue;
      if (next[task.id]) continue;
      if (dismissedTaskIds.includes(task.id)) continue;

      next[task.id] = buildMission(task, origin);
      changed = true;
    }

    if (changed) {
      set({ missions: next });
      persist(next, dismissedTaskIds);
    }
  },

  createMission: (task, origin, placeName) => {
    if (!origin) return null;
    const mission = buildMission(task, origin, placeName);
    const missions = { ...get().missions, [task.id]: mission };
    const dismissedTaskIds = get().dismissedTaskIds.filter((id) => id !== task.id);
    set({ missions, dismissedTaskIds });
    persist(missions, dismissedTaskIds);
    return mission;
  },

  relockMission: (task, origin, placeName) => {
    const dismissedTaskIds = get().dismissedTaskIds.filter((id) => id !== task.id);
    set({ dismissedTaskIds });
    const mission = get().createMission(task, origin, placeName);
    persist(get().missions, dismissedTaskIds);
    return mission;
  },

  resetMission: (taskId) => {
    const missions = { ...get().missions };
    delete missions[taskId];
    const dismissedTaskIds = Array.from(new Set([...get().dismissedTaskIds, taskId]));
    set({ missions, dismissedTaskIds });
    persist(missions, dismissedTaskIds);
  },

  capturePhoto: async (taskId, uri, caption) => {
    const existing = get().missions[taskId];
    if (!existing) return;

    const savedUri = await savePhotoCopy(taskId, uri);
    const missions = {
      ...get().missions,
      [taskId]: {
        ...existing,
        photoUri: savedUri,
        photoCaption: caption,
        capturedAt: new Date().toISOString(),
        completed: true,
      },
    };

    set({ missions });
    persist(missions, get().dismissedTaskIds);
  },

  getMission: (taskId) => (taskId ? get().missions[taskId] : undefined),
}));

export { isOutdoorTask };

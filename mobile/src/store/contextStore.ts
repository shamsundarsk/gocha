import { create } from 'zustand';
import { UnifiedContext } from '@/types';
import { contextApi } from '@/services/api';

interface ContextStore {
  context: UnifiedContext | null;
  isLoading: boolean;
  lastUpdated: Date | null;

  fetchContext: () => Promise<void>;
  updateLocation: (lat: number, lon: number) => Promise<void>;
}

export const useContextStore = create<ContextStore>((set) => ({
  context: null,
  isLoading: false,
  lastUpdated: null,

  fetchContext: async () => {
    set({ isLoading: true });
    try {
      const res = await contextApi.getCurrent();
      set({ context: res.data, isLoading: false, lastUpdated: new Date() });
    } catch {
      set({ isLoading: false });
    }
  },

  updateLocation: async (lat, lon) => {
    try {
      await contextApi.updateLocation(lat, lon);
    } catch {}
  },
}));

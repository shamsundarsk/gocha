import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  loadFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const userStr = await SecureStore.getItemAsync('auth_user');
      if (token && userStr) {
        set({ token, user: JSON.parse(userStr), isAuthenticated: true });
      }
    } catch {}
    set({ isLoading: false });
  },

  login: async (email, password) => {
    const res = await authApi.login(email, password);
    const { access_token, user_id, full_name } = res.data;
    const user: User = { id: user_id, email, full_name, created_at: new Date().toISOString() };
    await SecureStore.setItemAsync('auth_token', access_token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ token: access_token, user, isAuthenticated: true });
  },

  register: async (email, password, fullName) => {
    const res = await authApi.register(email, password, fullName);
    const { access_token, user_id } = res.data;
    const user: User = { id: user_id, email, full_name: fullName, created_at: new Date().toISOString() };
    await SecureStore.setItemAsync('auth_token', access_token);
    await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
    set({ token: access_token, user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));

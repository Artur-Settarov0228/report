import { create } from 'zustand';
import { User } from '../types';
import { getMe } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    if (!get().token) return;
    try {
      const user = await getMe();
      set({ user, isAuthenticated: true });
    } catch (error) {
      get().logout();
    }
  },
}));

// Listen to interceptor event
window.addEventListener('unauthorized', () => {
  useAuthStore.getState().logout();
});

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User) => void;
  clearAuth: () => void;
}

const getStoredUser = () => {
  const stored = localStorage.getItem('user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('accessToken'),
  user: getStoredUser(),
  setAuth: (accessToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, user });
  },
  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ accessToken: null, user: null });
  },
}));

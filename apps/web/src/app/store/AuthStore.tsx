import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/apiClient';

/** Usuario persistido en el cliente */
export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Formato JSON que devuelve el backend (login / register) — camelCase o PascalCase (.NET) */
interface AuthApiResponse {
  token: string;
  user: AuthUser;
}


interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthApiResponse>('/auth/login', { email, password });
          const token = String(data.token).trim();
          localStorage.setItem('auth_token', token);
          set({
            user: data.user,
            accessToken: token,
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      register: async (firstName: string, lastName: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<AuthApiResponse>('/auth/register', {
            firstName,
            lastName,
            email,
            password,
          });
          const token = String(data.token).trim();
          localStorage.setItem('auth_token', token);
          set({
            user: data.user,
            accessToken: token,
            isLoading: false,
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, accessToken: null, isLoading: false, error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        const t = state?.accessToken?.trim();
        if (t) localStorage.setItem('auth_token', t);
      },
    },
  ),
);

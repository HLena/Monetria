import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/app/lib';
import { updateProfile as updateProfileApi, updatePreferences as updatePreferencesApi, changePassword as changePasswordApi, deactivateMyAccount } from '@/app/api';
import type { UpdateProfileRequestBody, UpdatePreferencesRequestBody, ChangePasswordRequestBody } from '@/app/types/api';

/** Usuario persistido en el cliente */
export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  preferredCurrency: string;
  dateFormat: string;
  theme: string;
  phoneNumber: string | null;
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
  updateProfile: (data: UpdateProfileRequestBody) => Promise<void>;
  updatePreferences: (data: UpdatePreferencesRequestBody) => Promise<void>;
  changePassword: (data: ChangePasswordRequestBody) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const dto = await updateProfileApi(data);
          set(state => ({
            isLoading: false,
            user: state.user
              ? { ...state.user, firstName: dto.firstName, lastName: dto.lastName, preferredCurrency: dto.preferredCurrency, dateFormat: dto.dateFormat, theme: dto.theme, phoneNumber: dto.phoneNumber }
              : state.user,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      updatePreferences: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const dto = await updatePreferencesApi(data);
          set(state => ({
            isLoading: false,
            user: state.user
              ? { ...state.user, preferredCurrency: dto.preferredCurrency, theme: dto.theme, dateFormat: dto.dateFormat }
              : state.user,
          }));
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      changePassword: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await changePasswordApi(data);
          set({ isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        try {
          await deactivateMyAccount();
          localStorage.removeItem('auth_token');
          set({ user: null, accessToken: null, isLoading: false, error: null });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
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

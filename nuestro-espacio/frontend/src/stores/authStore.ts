// ===========================================
// ZUSTAND STORE - AUTH STATE MANAGEMENT
// ===========================================

import { create } from 'zustand';
import apiClient from '../services/api';

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  anniversaryDate?: string | null;
  twoFaEnabled: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string, twoFAToken?: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  checkAuth: () => Promise<boolean>;
  clearAuth: () => void;
}

// Store inicial
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,

  login: async (email: string, password: string, twoFAToken?: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
        twoFAToken,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        name,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      const { accessToken } = get();
      
      if (accessToken) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().clearAuth();
    }
  },

  updateUser: (data: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  checkAuth: async (): Promise<boolean> => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (!accessToken || !refreshToken || !userStr) {
      set({ ...initialState, isLoading: false });
      return false;
    }

    try {
      const user = JSON.parse(userStr) as User;
      
      // Verificar si el token es válido
      const response = await apiClient.get('/auth/me');
      const currentUser = response.data.data;

      set({
        user: currentUser,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      // Token inválido, intentar refresh
      try {
        const response = await apiClient.post('/auth/refresh-token', {
          refreshToken,
        });

        const { accessToken: newAccessToken } = response.data.data;
        const user = JSON.parse(userStr) as User;

        localStorage.setItem('accessToken', newAccessToken);

        set({
          user,
          accessToken: newAccessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        return true;
      } catch (refreshError) {
        get().clearAuth();
        return false;
      }
    }
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    set(initialState);
  },
}));

// Selector para obtener el usuario actual
export const selectCurrentUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;

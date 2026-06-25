// store/authStore.ts
import { create } from 'zustand';
import api from '../config/api';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { secureStorage } from '../utils/secureStorage';

export interface ApiAuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  initializeAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true });

      const response = await api.post<ApiAuthResponse>('/auth/login', credentials);
      const { user, token } = response.data.data;

      secureStorage.setItem('auth_token', token);
      secureStorage.setItem('user_data', JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      return Promise.resolve();
    } catch (error: any) {
      set({ isLoading: false });

      const backendErrors = error.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        const firstError = backendErrors[0]?.message;
        if (firstError) {
          throw new Error(firstError);
        }
      }

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  register: async (credentials: RegisterCredentials) => {
    try {
      set({ isLoading: true });
      await api.post<ApiAuthResponse>('/auth/register', credentials);
      return Promise.resolve();
    } catch (error: any) {
      set({ isLoading: false });

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  },

  logout: () => {
    // ✅ Clear all storage items
    secureStorage.removeItem('auth_token');
    secureStorage.removeItem('user_data');
    secureStorage.removeItem('pairing_session_id');
    secureStorage.removeItem('current_game_session');
    secureStorage.removeItem('init_state');
    
    // ✅ Also clear from localStorage directly as fallback
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('pairing_session_id');
      localStorage.removeItem('current_game_session');
      localStorage.removeItem('init_state');
    } catch {
      // Ignore localStorage errors
    }
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // ✅ New method to clear just the session
  clearSession: () => {
    secureStorage.removeItem('pairing_session_id');
    secureStorage.removeItem('current_game_session');
    secureStorage.removeItem('init_state');
    try {
      localStorage.removeItem('pairing_session_id');
      localStorage.removeItem('current_game_session');
      localStorage.removeItem('init_state');
    } catch {
      // Ignore localStorage errors
    }
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initializeAuth: () => {
    const token = secureStorage.getItem('auth_token');
    const userData = secureStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        secureStorage.removeItem('auth_token');
        secureStorage.removeItem('user_data');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      set({
        isLoading: false,
      });
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateUser: (user: User) => {
    secureStorage.setItem('user_data', JSON.stringify(user));
    set({ user });
  },
}));
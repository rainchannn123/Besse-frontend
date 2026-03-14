// store/authStore.ts
import { create } from 'zustand';
import api from '../config/api';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { secureStorage } from '../utils/secureStorage';

// Update the AuthResponse interface to match your API
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
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true });

      // Use the correct response type
      const response = await api.post<ApiAuthResponse>('/auth/login', credentials);

      // Extract data from the response structure
      const { user, token } = response.data.data;

      // Store in secure storage
      secureStorage.setItem('auth_token', token);
      secureStorage.setItem('user_data', JSON.stringify(user));

      // Update state
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      return Promise.resolve();
    } catch (error: any) {
      set({ isLoading: false });

      // Throw error to be caught in component
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

      // Use the correct response type
      const response = await api.post<ApiAuthResponse>('/auth/register', credentials);
      const { user, token } = response.data.data;

      set({ isLoading: false });
      return Promise.resolve();
    } catch (error: any) {
      set({ isLoading: false });

      // Throw error to be caught in component
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
    secureStorage.removeItem('auth_token');
    secureStorage.removeItem('user_data');
    secureStorage.removeItem('pairing_session_id');
    secureStorage.removeItem('current_game_session');
    secureStorage.removeItem('init_state');
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
        // Clear invalid data
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
    // Update secure storage
    secureStorage.setItem('user_data', JSON.stringify(user));
    // Update state
    set({ user });
  },
}));

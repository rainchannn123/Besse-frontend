import axios from 'axios';
import { secureStorage } from '@/utils/secureStorage';
import {
  AdminForceExitResponse,
  AdminLoginResponse,
  AdminOverviewResponse,
  AdminPlayerHistoryResponse,
} from '@/types/admin';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_TOKEN_KEY = 'admin_monitor_token';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/+$/, '');

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

adminApi.interceptors.request.use(config => {
  const adminToken = secureStorage.getItem(ADMIN_TOKEN_KEY);

  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  return config;
});

export const adminService = {
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await adminApi.post<AdminLoginResponse>(
      '/admin/auth/login',
      {
        username,
        password,
      }
    );

    if (response.data.success && response.data.data?.token) {
      secureStorage.setItem(ADMIN_TOKEN_KEY, response.data.data.token);
    }

    return response.data;
  },

  async getOverview(): Promise<AdminOverviewResponse> {
    const response = await adminApi.get<AdminOverviewResponse>('/admin/monitor/overview');
    return response.data;
  },

  async forceExitPlayer(userId: string, reason?: string): Promise<AdminForceExitResponse> {
    const response = await adminApi.patch<AdminForceExitResponse>(
      `/admin/players/${userId}/force-exit`,
      {
        reason,
      }
    );

    return response.data;
  },

  logout(): void {
    secureStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  hasToken(): boolean {
    return Boolean(secureStorage.getItem(ADMIN_TOKEN_KEY));
  },

  async getPlayerHistory(
    userId: string,
    limit = 10,
    page = 0
  ): Promise<AdminPlayerHistoryResponse> {
    const response = await adminApi.get<AdminPlayerHistoryResponse>(
      `/admin/players/${userId}/history`,
      { params: { limit, page } }
    );
    return response.data;
  },
};

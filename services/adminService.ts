import axios from 'axios';
import { secureStorage } from '@/utils/secureStorage';
import {
  ActivityLogFilters,
  ActivityLogListResponse,
  ActivityLogStatsResponse,
  AdminForceExitResponse,
  AdminLoginResponse,
  AdminOverviewResponse,
  AdminPlayerHistoryResponse,
  AdminRoomLiveOverviewQuery,
  AdminRoomLiveOverviewResponse,
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

// ✅ Request interceptor - try both admin token and regular auth token
adminApi.interceptors.request.use(
  (config) => {
    let token = secureStorage.getItem(ADMIN_TOKEN_KEY);
    
    if (!token) {
      token = secureStorage.getItem('auth_token');
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 API Request to ${config.url}: Token found`);
    } else {
      console.warn(`⚠️ API Request to ${config.url}: No token found`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor for better error handling
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.warn('🔴 401 Unauthorized - Token may be expired or invalid');
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    try {
      console.log('🔐 Admin login attempt:', { username });

      const response = await adminApi.post<AdminLoginResponse>(
        '/admin/auth/login',
        {
          username,
          password,
        }
      );

            console.log('📦 Admin login response:', response.data);

      if (response.data.success && response.data.data?.token) {
        secureStorage.setItem(ADMIN_TOKEN_KEY, response.data.data.token);

        if (typeof window !== 'undefined') {
          localStorage.setItem(ADMIN_TOKEN_KEY, response.data.data.token);
        }

        console.log('✅ Admin token stored successfully');
        console.log('🔑 Token:', response.data.data.token.substring(0, 50) + '...');
      }


      return response.data;
    } catch (error: any) {
      console.error('❌ Admin login error:', error.message);
      if (error.response) {
        console.error('📄 Response status:', error.response.status);
        console.error('📄 Response data:', error.response.data);
      }
      throw error;
    }
  },

  async getOverview(): Promise<AdminOverviewResponse> {
    try {
      console.log('📊 Fetching admin overview...');
      const response = await adminApi.get<AdminOverviewResponse>('/admin/monitor/overview');
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch overview:', error.message);
      throw error;
    }
  },

  async forceExitPlayer(userId: string, reason?: string): Promise<AdminForceExitResponse> {
    try {
      console.log(`🚪 Force exiting player: ${userId}`);
      const response = await adminApi.patch<AdminForceExitResponse>(
        `/admin/players/${userId}/force-exit`,
        {
          reason: reason || 'Admin manual reset',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to force exit player:', error.message);
      throw error;
    }
    },

  logout(): void {
    console.log('🔓 Admin logout');
    secureStorage.removeItem(ADMIN_TOKEN_KEY);

    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
    },

  hasToken(): boolean {
    const secureToken = secureStorage.getItem(ADMIN_TOKEN_KEY);
    const localToken = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    const token = secureToken || localToken;

    console.log(`🔍 Has admin token: ${!!token}`);
    return Boolean(token);
    },

  getToken(): string | null {
    const secureToken = secureStorage.getItem(ADMIN_TOKEN_KEY);
    const localToken = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null;
    return secureToken || localToken;
    },

  async getPlayerHistory(
    userId: string,
    limit = 10,
    page = 0
  ): Promise<AdminPlayerHistoryResponse> {
    try {
      console.log(`📜 Fetching history for player: ${userId}`);
      const response = await adminApi.get<AdminPlayerHistoryResponse>(
        `/admin/players/${userId}/history`,
        { params: { limit, page } }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch player history:', error.message);
      throw error;
    }
  },

  async getRoomLiveOverview(
    roomCode: string,
    query: AdminRoomLiveOverviewQuery = {}
  ): Promise<AdminRoomLiveOverviewResponse> {
    try {
      const normalizedRoomCode = roomCode.trim().toUpperCase();
      const params: Record<string, string | number | boolean> = {};

      if (typeof query.flowLimit === 'number' && Number.isFinite(query.flowLimit)) {
        params.flowLimit = query.flowLimit;
      }
      if (query.flowFrom) params.flowFrom = query.flowFrom;
      if (query.flowTo) params.flowTo = query.flowTo;
      if (typeof query.includeFlowEvents === 'boolean') {
        params.includeFlowEvents = query.includeFlowEvents;
      }

      const response = await adminApi.get<AdminRoomLiveOverviewResponse>(
        `/admin/monitor/rooms/${normalizedRoomCode}/live-overview`,
        { params }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch room live overview:', error.message);
      throw error;
    }
  },

    async getActivityLogs(
    filters: ActivityLogFilters = {}
  ): Promise<ActivityLogListResponse> {
    try {
      const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 50,
      };

      if (filters.category) params.category = filters.category;
      if (filters.status) params.status = filters.status;
      if (filters.action) params.action = filters.action;
      if (filters.userId) params.userId = filters.userId;
      if (filters.userEmail) params.userEmail = filters.userEmail;
      if (filters.sessionId) params.sessionId = filters.sessionId;
      if (filters.search) params.search = filters.search;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const response = await adminApi.get<ActivityLogListResponse>(
        '/admin/activity-logs',
        { params }
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch activity logs:', error.message);
      throw error;
    }
  },

  async getActivityLogStats(): Promise<ActivityLogStatsResponse> {
    try {
      const response = await adminApi.get<ActivityLogStatsResponse>(
        '/admin/activity-logs/stats'
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch activity log stats:', error.message);
      throw error;
    }
  },
};
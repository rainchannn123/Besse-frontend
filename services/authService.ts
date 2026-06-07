import api from '../config/api';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, ProfileResponse } from '../types/besse';

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  async getProfile(): Promise<ProfileResponse> {
    const response = await api.get<ProfileResponse>('/auth/profile');
    return response.data;
  },
};
import apiClient from './client';
import type { User } from '../types/user.types';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: LoginResponse }>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: { accessToken: string } }>('/auth/refresh', { refreshToken }),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<{ data: User }>('/auth/me'),
};

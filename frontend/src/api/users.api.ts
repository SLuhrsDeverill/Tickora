import apiClient from './client';
import type { User } from '../types/user.types';

export const usersApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<{ data: User[]; meta: object }>('/users', { params }),

  get: (id: string) => apiClient.get<{ data: User }>(`/users/${id}`),

  create: (data: Partial<User> & { password: string }) =>
    apiClient.post<{ data: User }>('/users', data),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<{ data: User }>(`/users/${id}`, data),

  changePassword: (id: string, currentPassword: string, newPassword: string) =>
    apiClient.patch(`/users/${id}/password`, { currentPassword, newPassword }),

  deactivate: (id: string) => apiClient.delete(`/users/${id}`),

  tickets: (id: string) => apiClient.get(`/users/${id}/tickets`),

  assets: (id: string) => apiClient.get(`/users/${id}/assets`),
};

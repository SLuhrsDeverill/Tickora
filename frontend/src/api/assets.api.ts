import apiClient from './client';
import type { Asset, AssetMaintenance } from '../types/asset.types';

export const assetsApi = {
  list: (params?: Record<string, string | number>) =>
    apiClient.get<{ data: Asset[]; meta: object }>('/assets', { params }),

  get: (id: string) => apiClient.get<{ data: Asset }>(`/assets/${id}`),

  create: (data: Partial<Asset>) =>
    apiClient.post<{ data: Asset }>('/assets', data),

  update: (id: string, data: Partial<Asset>) =>
    apiClient.patch<{ data: Asset }>(`/assets/${id}`, data),

  delete: (id: string) => apiClient.delete(`/assets/${id}`),

  assign: (id: string, userId: string, notes?: string) =>
    apiClient.post<{ data: Asset }>(`/assets/${id}/assign`, { userId, notes }),

  unassign: (id: string) =>
    apiClient.post<{ data: Asset }>(`/assets/${id}/unassign`),

  maintenance: (id: string, data: Partial<AssetMaintenance>) =>
    apiClient.post<{ data: AssetMaintenance }>(`/assets/${id}/maintenance`, data),

  summary: () => apiClient.get<{ data: object }>('/assets/stats/summary'),
};

import apiClient from './client';

export const settingsApi = {
  getAll: () => apiClient.get<{ data: Record<string, string> }>('/settings'),
  setMany: (settings: Record<string, string>) =>
    apiClient.put<{ data: Record<string, string> }>('/settings', settings),
  getDepartments: () => apiClient.get('/settings/departments'),
  createDepartment: (name: string, code: string, managerId?: string) =>
    apiClient.post('/settings/departments', { name, code, managerId }),
  updateDepartment: (id: string, data: object) => apiClient.patch(`/settings/departments/${id}`, data),
  deleteDepartment: (id: string) => apiClient.delete(`/settings/departments/${id}`),
  getBotStats: () => apiClient.get('/settings/bot/stats'),
};

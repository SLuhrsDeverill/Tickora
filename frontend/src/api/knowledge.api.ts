import apiClient from './client';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; firstName: string; lastName: string };
}

export const knowledgeApi = {
  list: (q?: string, category?: string) =>
    apiClient.get<{ data: KBArticle[] }>('/knowledge', { params: { q, category } }),
  getById: (id: string) => apiClient.get<{ data: KBArticle }>(`/knowledge/${id}`),
  create: (data: Partial<KBArticle>) => apiClient.post<{ data: KBArticle }>('/knowledge', data),
  update: (id: string, data: Partial<KBArticle>) => apiClient.patch<{ data: KBArticle }>(`/knowledge/${id}`, data),
  delete: (id: string) => apiClient.delete(`/knowledge/${id}`),
  markHelpful: (id: string) => apiClient.post(`/knowledge/${id}/helpful`),
  markNotHelpful: (id: string) => apiClient.post(`/knowledge/${id}/not-helpful`),
};

import apiClient from './client';
import type { Ticket, Comment } from '../types/ticket.types';

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  myTickets?: boolean;
}

export const ticketsApi = {
  list: (filters?: TicketFilters) =>
    apiClient.get<{ data: Ticket[]; meta: PaginatedResponse<Ticket>['meta'] }>('/tickets', { params: filters }),

  get: (id: string) => apiClient.get<{ data: Ticket }>(`/tickets/${id}`),

  create: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    assetId?: string;
  }) => apiClient.post<{ data: Ticket }>('/tickets', data),

  update: (id: string, data: Partial<Ticket>) =>
    apiClient.patch<{ data: Ticket }>(`/tickets/${id}`, data),

  delete: (id: string) => apiClient.delete(`/tickets/${id}`),

  changeStatus: (id: string, status: string, resolution?: string) =>
    apiClient.patch<{ data: Ticket }>(`/tickets/${id}/status`, { status, resolution }),

  assign: (id: string, assignedToId: string | null) =>
    apiClient.patch<{ data: Ticket }>(`/tickets/${id}/assign`, { assignedToId }),

  addComment: (id: string, content: string, isInternal: boolean) =>
    apiClient.post<{ data: Comment }>(`/tickets/${id}/comments`, { content, isInternal }),
};

import apiClient from './client';
import type {
  DashboardMetrics,
  CategoryMetric,
  TrendMetric,
  ResolutionTimeMetric,
  AgentPerformance,
  SlaCompliance,
} from '../types/metrics.types';

export const metricsApi = {
  dashboard: () => apiClient.get<{ data: DashboardMetrics }>('/metrics/dashboard'),

  byCategory: (params?: { dateFrom?: string; dateTo?: string }) =>
    apiClient.get<{ data: CategoryMetric[] }>('/metrics/tickets/by-category', { params }),

  byStatus: () =>
    apiClient.get<{ data: Array<{ status: string; count: number }> }>('/metrics/tickets/by-status'),

  trend: (period?: 'week' | 'month' | '3months') =>
    apiClient.get<{ data: TrendMetric[] }>('/metrics/tickets/trend', { params: { period } }),

  resolutionTime: () =>
    apiClient.get<{ data: ResolutionTimeMetric[] }>('/metrics/tickets/resolution-time'),

  agentPerformance: () =>
    apiClient.get<{ data: AgentPerformance[] }>('/metrics/agents/performance'),

  slaCompliance: () =>
    apiClient.get<{ data: SlaCompliance }>('/metrics/sla/compliance'),

  assetsInventory: () =>
    apiClient.get<{ data: object }>('/metrics/assets/inventory'),
};

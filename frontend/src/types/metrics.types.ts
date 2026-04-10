export interface DashboardMetrics {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  totalTickets: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
  ticketsByCategory: CategoryMetric[];
  topIssues: CategoryMetric[];
  assetsTotal: number;
  assetsAvailable: number;
  assetsInRepair: number;
}

export interface CategoryMetric {
  category: string;
  label: string;
  count: number;
  percentage: number;
}

export interface TrendMetric {
  date: string;
  created: number;
  resolved: number;
}

export interface ResolutionTimeMetric {
  category: string;
  label: string;
  avgHours: number;
}

export interface AgentPerformance {
  agentId: string;
  name: string;
  resolvedCount: number;
  avgResolutionHours: number;
  slaCompliancePercent: number;
}

export interface SlaCompliance {
  total: number;
  resolved: number;
  compliant: number;
  breached: number;
  pendingBreached: number;
  compliancePercent: number;
}

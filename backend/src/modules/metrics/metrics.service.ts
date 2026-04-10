import prisma from '../../config/database';
import { getRedis } from '../../config/redis';

const CACHE_TTL = 300; // 5 minutes

async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  try {
    const redis = getRedis();
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;

    const data = await fn();
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    return data;
  } catch {
    // If Redis fails, just execute without cache
    return fn();
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: 'Hardware', SOFTWARE: 'Software', NETWORK: 'Red',
  EMAIL: 'Email', PRINTER: 'Impresora', ACCESS_PERMISSIONS: 'Accesos y Permisos',
  PHONE: 'Teléfono', OTHER: 'Otros',
};

export class MetricsService {
  async getDashboard() {
    return withCache('metrics:dashboard', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        openTickets,
        inProgressTickets,
        resolvedToday,
        totalTickets,
        resolvedTickets,
        categoryGroups,
        assetStats,
      ] = await Promise.all([
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.ticket.count({ where: { status: 'RESOLVED', resolvedAt: { gte: today } } }),
        prisma.ticket.count({ where: { status: { not: 'OPEN' } } }),
        prisma.ticket.findMany({
          where: { resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true, slaDeadline: true },
        }),
        prisma.ticket.groupBy({ by: ['category'], _count: { id: true } }),
        prisma.asset.groupBy({ by: ['status'], _count: { id: true } }),
      ]);

      // Calculate avg resolution time
      const resolutionTimes = resolvedTickets
        .filter((t) => t.resolvedAt)
        .map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));
      const avgResolutionHours =
        resolutionTimes.length > 0
          ? Math.round((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) * 10) / 10
          : 0;

      // SLA compliance
      const slaTickets = resolvedTickets.filter((t) => t.slaDeadline && t.resolvedAt);
      const slaCompliant = slaTickets.filter((t) => t.resolvedAt! <= t.slaDeadline!).length;
      const slaCompliancePercent =
        slaTickets.length > 0 ? Math.round((slaCompliant / slaTickets.length) * 1000) / 10 : 100;

      const totalCategoryCount = categoryGroups.reduce((s, c) => s + c._count.id, 0);
      const ticketsByCategory = categoryGroups
        .map((c) => ({
          category: c.category,
          label: CATEGORY_LABELS[c.category] || c.category,
          count: c._count.id,
          percentage: totalCategoryCount > 0 ? Math.round((c._count.id / totalCategoryCount) * 1000) / 10 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      const topIssues = ticketsByCategory.slice(0, 3);

      const assetStatusMap = Object.fromEntries(assetStats.map((a) => [a.status, a._count.id]));

      return {
        openTickets,
        inProgressTickets,
        resolvedToday,
        totalTickets,
        avgResolutionHours,
        slaCompliancePercent,
        ticketsByCategory,
        topIssues,
        assetsTotal: Object.values(assetStatusMap).reduce((a, b) => a + b, 0),
        assetsAvailable: assetStatusMap['AVAILABLE'] || 0,
        assetsInRepair: assetStatusMap['IN_REPAIR'] || 0,
      };
    });
  }

  async getTicketsByCategory(dateFrom?: string, dateTo?: string) {
    const where = {
      ...(dateFrom || dateTo
        ? { createdAt: { ...(dateFrom && { gte: new Date(dateFrom) }), ...(dateTo && { lte: new Date(dateTo) }) } }
        : {}),
    };

    const groups = await prisma.ticket.groupBy({ by: ['category'], where, _count: { id: true } });
    const total = groups.reduce((s, g) => s + g._count.id, 0);

    return groups.map((g) => ({
      category: g.category,
      label: CATEGORY_LABELS[g.category] || g.category,
      count: g._count.id,
      percentage: total > 0 ? Math.round((g._count.id / total) * 1000) / 10 : 0,
    }));
  }

  async getTicketsByStatus() {
    const groups = await prisma.ticket.groupBy({ by: ['status'], _count: { id: true } });
    return groups.map((g) => ({ status: g.status, count: g._count.id }));
  }

  async getTicketsTrend(period: string = 'week') {
    const days = period === 'month' ? 30 : period === '3months' ? 90 : 7;
    const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [created, resolved] = await Promise.all([
      prisma.ticket.findMany({ where: { createdAt: { gte: dateFrom } }, select: { createdAt: true } }),
      prisma.ticket.findMany({
        where: { resolvedAt: { gte: dateFrom } },
        select: { resolvedAt: true },
      }),
    ]);

    // Group by date
    const byDate: Record<string, { created: number; resolved: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(dateFrom);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0]!;
      byDate[key] = { created: 0, resolved: 0 };
    }

    created.forEach((t) => {
      const key = t.createdAt.toISOString().split('T')[0]!;
      if (byDate[key]) byDate[key]!.created++;
    });

    resolved.forEach((t) => {
      const key = t.resolvedAt!.toISOString().split('T')[0]!;
      if (byDate[key]) byDate[key]!.resolved++;
    });

    return Object.entries(byDate).map(([date, counts]) => ({ date, ...counts }));
  }

  async getResolutionTime() {
    const tickets = await prisma.ticket.findMany({
      where: { resolvedAt: { not: null } },
      select: { category: true, priority: true, createdAt: true, resolvedAt: true },
    });

    const byCategory: Record<string, number[]> = {};
    tickets.forEach((t) => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category]!.push((t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));
    });

    return Object.entries(byCategory).map(([category, times]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      avgHours: times.length > 0 ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0,
    }));
  }

  async getAgentPerformance() {
    const agents = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'IT_AGENT'] }, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        ticketsAssigned: {
          where: { resolvedAt: { not: null } },
          select: { createdAt: true, resolvedAt: true, slaDeadline: true },
        },
      },
    });

    return agents.map((agent) => {
      const resolved = agent.ticketsAssigned;
      const times = resolved.map((t) => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60));
      const avgHours = times.length > 0 ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10 : 0;
      const slaCompliant = resolved.filter((t) => t.slaDeadline && t.resolvedAt! <= t.slaDeadline!).length;
      const slaPercent = resolved.length > 0 ? Math.round((slaCompliant / resolved.length) * 1000) / 10 : 100;

      return {
        agentId: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        resolvedCount: resolved.length,
        avgResolutionHours: avgHours,
        slaCompliancePercent: slaPercent,
      };
    });
  }

  async getSlaCompliance() {
    const tickets = await prisma.ticket.findMany({
      where: { slaDeadline: { not: null } },
      select: { status: true, slaDeadline: true, resolvedAt: true },
    });

    const resolved = tickets.filter((t) => t.resolvedAt);
    const compliant = resolved.filter((t) => t.resolvedAt! <= t.slaDeadline!);
    const breached = resolved.filter((t) => t.resolvedAt! > t.slaDeadline!);
    const pending = tickets.filter((t) => !t.resolvedAt && t.slaDeadline! < new Date());

    return {
      total: tickets.length,
      resolved: resolved.length,
      compliant: compliant.length,
      breached: breached.length,
      pendingBreached: pending.length,
      compliancePercent: resolved.length > 0 ? Math.round((compliant.length / resolved.length) * 1000) / 10 : 100,
    };
  }

  async getAssetsInventory() {
    const [byType, byStatus] = await Promise.all([
      prisma.asset.groupBy({ by: ['type'], _count: { id: true } }),
      prisma.asset.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    return { byType, byStatus };
  }
}

export const metricsService = new MetricsService();

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { Ticket, Clock, CheckCircle, TrendingUp, Monitor } from 'lucide-react';
import { metricsApi } from '../api/metrics.api';
import { ticketsApi } from '../api/tickets.api';
import KPICard from '../components/metrics/KPICard';
import TicketStatusBadge from '../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../components/tickets/TicketPriorityBadge';
import { CardSkeleton } from '../components/ui/LoadingSkeleton';
import { formatDate } from '../utils/formatDate';
import type { DashboardMetrics, TrendMetric } from '../types/metrics.types';
import type { Ticket as TicketType } from '../types/ticket.types';
import { useAuthStore } from '../store/auth.store';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#6b7280'];

const PERIOD_LABELS = { week: 'Última semana', month: 'Último mes', '3months': 'Últimos 3 meses' };

export default function Dashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trend, setTrend] = useState<TrendMetric[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [myTickets, setMyTickets] = useState<TicketType[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

        const [recentRes, ...rest] = await Promise.all([
          ticketsApi.list({ limit: 10, page: 1 }),
          ...(isIT
            ? [
                metricsApi.dashboard(),
                metricsApi.trend(period),
                ticketsApi.list({ limit: 5, myTickets: true }),
              ]
            : []),
        ]);

        setRecentTickets(recentRes.data.data.slice(0, 10));

        if (isIT && rest.length >= 3) {
          setMetrics((rest[0] as Awaited<ReturnType<typeof metricsApi.dashboard>>).data.data);
          setTrend((rest[1] as Awaited<ReturnType<typeof metricsApi.trend>>).data.data);
          const myRes = rest[2] as Awaited<ReturnType<typeof ticketsApi.list>>;
          setMyTickets(myRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.role, period]);

  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards - only for IT/Admin */}
      {isIT && metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tickets Abiertos"
            value={metrics.openTickets}
            subtitle="Pendientes de atención"
            icon={<Ticket size={20} />}
            color="blue"
          />
          <KPICard
            title="En Progreso"
            value={metrics.inProgressTickets}
            subtitle="Siendo atendidos"
            icon={<Clock size={20} />}
            color="amber"
          />
          <KPICard
            title="Resueltos Hoy"
            value={metrics.resolvedToday}
            subtitle="Tickets resueltos hoy"
            icon={<CheckCircle size={20} />}
            color="green"
          />
          <KPICard
            title="Cumpl. SLA"
            value={`${metrics.slaCompliancePercent}%`}
            subtitle={`Promedio resolución: ${metrics.avgResolutionHours}h`}
            icon={<TrendingUp size={20} />}
            color="purple"
          />
        </div>
      )}

      {/* Charts row - only for IT/Admin */}
      {isIT && metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">¿De dónde vienen los problemas?</h3>
            {metrics.ticketsByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={metrics.ticketsByCategory}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percentage }) => `${label} (${percentage}%)`}
                    labelLine={false}
                  >
                    {metrics.ticketsByCategory.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">Sin datos disponibles</p>
            )}
          </div>

          {/* Asset Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Resumen de Activos IT</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Monitor size={18} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Total Activos</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{metrics.assetsTotal}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-800">Disponibles</span>
                <span className="text-lg font-bold text-green-600">{metrics.assetsAvailable}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm font-medium text-amber-800">En Reparación</span>
                <span className="text-lg font-bold text-amber-600">{metrics.assetsInRepair}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend chart - only for IT/Admin */}
      {isIT && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Tendencia de Tickets</h3>
            <div className="flex gap-2">
              {(Object.keys(PERIOD_LABELS) as Array<keyof typeof PERIOD_LABELS>).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Creados" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resueltos" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos para el período seleccionado</p>
          )}
        </div>
      )}

      {/* Two tables row */}
      <div className={`grid gap-6 ${isIT ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Recent Tickets */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Tickets Recientes</h3>
            <Link to="/tickets" className="text-sm text-blue-600 hover:text-blue-700">Ver todos</Link>
          </div>
          <div className="overflow-x-auto">
            {recentTickets.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No hay tickets</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prioridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/tickets/${ticket.id}`} className="font-mono text-blue-600 hover:text-blue-800 text-xs">
                          {ticket.ticketNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/tickets/${ticket.id}`} className="text-gray-900 hover:text-blue-600 line-clamp-1">
                          {ticket.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3"><TicketPriorityBadge priority={ticket.priority} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* My Assigned Tickets (IT only) */}
        {isIT && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Mis Tickets Asignados</h3>
              <Link to="/tickets?myTickets=true" className="text-sm text-blue-600 hover:text-blue-700">Ver todos</Link>
            </div>
            <div className="overflow-x-auto">
              {myTickets.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No tenés tickets asignados</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Título</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prioridad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/tickets/${ticket.id}`} className="font-mono text-blue-600 hover:text-blue-800 text-xs">
                            {ticket.ticketNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link to={`/tickets/${ticket.id}`} className="text-gray-900 hover:text-blue-600 line-clamp-1">
                            {ticket.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><TicketPriorityBadge priority={ticket.priority} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(ticket.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

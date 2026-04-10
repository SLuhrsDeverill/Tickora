import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { metricsApi } from '../../api/metrics.api';
import type {
  CategoryMetric,
  AgentPerformance,
  SlaCompliance,
  ResolutionTimeMetric,
} from '../../types/metrics.types';
import { CardSkeleton } from '../../components/ui/LoadingSkeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#6b7280'];

function getBarColor(hours: number) {
  if (hours <= 8) return '#10b981';
  if (hours <= 24) return '#f59e0b';
  return '#ef4444';
}

export default function MetricsDashboard() {
  const [byCategory, setByCategory] = useState<CategoryMetric[]>([]);
  const [resolutionTime, setResolutionTime] = useState<ResolutionTimeMetric[]>([]);
  const [agentPerf, setAgentPerf] = useState<AgentPerformance[]>([]);
  const [sla, setSla] = useState<SlaCompliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [catRes, rtRes, agentRes, slaRes] = await Promise.all([
        metricsApi.byCategory({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
        metricsApi.resolutionTime(),
        metricsApi.agentPerformance(),
        metricsApi.slaCompliance(),
      ]);
      setByCategory(catRes.data.data);
      setResolutionTime(rtRes.data.data);
      setAgentPerf(agentRes.data.data);
      setSla(slaRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const topCategory = byCategory.sort((a, b) => b.count - a.count)[0];

  const handleExportCsv = () => {
    const rows = [
      ['Categoría', 'Cantidad', 'Porcentaje'],
      ...byCategory.map((c) => [c.label, c.count, `${c.percentage}%`]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={load} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Aplicar filtros
          </button>
          <button onClick={handleExportCsv} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium ml-auto">
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Insights */}
      {topCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm">
            <strong>Insight:</strong> En el período seleccionado, el <strong>{topCategory.percentage}%</strong> de tickets fueron por{' '}
            <strong>{topCategory.label}</strong> ({topCategory.count} tickets). Es el problema más frecuente.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Origen de Problemas</h3>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" name="Tickets" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
        </div>

        {/* Resolution time */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tiempo de Resolución por Categoría (horas)</h3>
          {resolutionTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={resolutionTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v}h`, 'Promedio']} />
                <Bar dataKey="avgHours" name="Horas promedio">
                  {resolutionTime.map((entry, index) => (
                    <Cell key={index} fill={getBarColor(entry.avgHours)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
          <div className="flex gap-4 mt-3 text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &lt;8h</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 8-24h</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &gt;24h</span>
          </div>
        </div>

        {/* SLA */}
        {sla && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Cumplimiento de SLA</h3>
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{sla.compliancePercent}%</div>
                <div className="text-xs text-gray-500 mt-1">Cumplimiento</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Resueltos en SLA</span>
                  <span className="font-medium text-green-600">{sla.compliant}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SLA incumplido</span>
                  <span className="font-medium text-red-500">{sla.breached}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">En riesgo</span>
                  <span className="font-medium text-amber-500">{sla.pendingBreached}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">{sla.total}</span>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${sla.compliancePercent}%` }} />
            </div>
          </div>
        )}

        {/* Agent performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Performance del Equipo IT</h3>
          {agentPerf.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Agente</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Resueltos</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Prom. horas</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">SLA %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {agentPerf.sort((a, b) => b.resolvedCount - a.resolvedCount).map((a) => (
                    <tr key={a.agentId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{a.name}</td>
                      <td className="px-3 py-2 text-center font-semibold text-blue-600">{a.resolvedCount}</td>
                      <td className="px-3 py-2 text-center">{a.avgResolutionHours}h</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-medium ${a.slaCompliancePercent >= 80 ? 'text-green-600' : a.slaCompliancePercent >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                          {a.slaCompliancePercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
        </div>
      </div>
    </div>
  );
}

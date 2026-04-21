import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Eye } from 'lucide-react';
import { ticketsApi } from '../../api/tickets.api';
import TicketStatusBadge from '../../components/tickets/TicketStatusBadge';
import TicketPriorityBadge from '../../components/tickets/TicketPriorityBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { formatDate } from '../../utils/formatDate';
import { TICKET_CATEGORY_LABELS } from '../../utils/constants';
import type { Ticket } from '../../types/ticket.types';
import { useAuthStore } from '../../store/auth.store';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'EMAIL', 'PRINTER', 'ACCESS_PERMISSIONS', 'PHONE', 'OTHER'];

export default function TicketList({ myTickets: myTicketsProp }: { myTickets?: boolean } = {}) {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    category: '',
    myTickets: myTicketsProp || searchParams.get('myTickets') === 'true',
  });

  const loadTickets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await ticketsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        category: filters.category || undefined,
        myTickets: filters.myTickets || undefined,
      });
      setTickets(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    loadTickets(1);
  }, [loadTickets]);

  const isAdmin = user?.role === 'ADMIN';
  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ticket?')) return;
    try {
      await ticketsApi.delete(id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert('Error al eliminar el ticket');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {meta.total} ticket{meta.total !== 1 ? 's' : ''}
          </h2>
        </div>
        <Link
          to="/tickets/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nuevo Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las prioridades</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{TICKET_CATEGORY_LABELS[c as keyof typeof TICKET_CATEGORY_LABELS]}</option>
            ))}
          </select>

          {isIT && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.myTickets}
                onChange={(e) => setFilters((f) => ({ ...f, myTickets: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <Filter size={14} /> Mis tickets
            </label>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={8} /></div>
        ) : tickets.length === 0 ? (
          <EmptyState
            title="No hay tickets"
            description="No se encontraron tickets con los filtros aplicados."
            action={
              <Link to="/tickets/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                Crear ticket
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Prioridad</th>
                  {isIT && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Asignado a</th>}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-blue-600">{ticket.ticketNumber}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link to={`/tickets/${ticket.id}`} className="text-gray-900 hover:text-blue-600 line-clamp-1 font-medium">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {TICKET_CATEGORY_LABELS[ticket.category]}
                    </td>
                    <td className="px-4 py-3"><TicketStatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-3"><TicketPriorityBadge priority={ticket.priority} /></td>
                    {isIT && (
                      <td className="px-4 py-3 text-gray-500">
                        {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : '—'}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(ticket.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/tickets/${ticket.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Eye size={15} />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Página {meta.page} de {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => loadTickets(p)}
                  className={`px-3 py-1 rounded text-sm ${
                    meta.page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

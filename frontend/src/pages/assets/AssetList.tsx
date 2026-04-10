import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import { assetsApi } from '../../api/assets.api';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { formatDateShort } from '../../utils/formatDate';
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS } from '../../utils/constants';
import type { Asset } from '../../types/asset.types';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';
import { isAfter, parseISO, subDays } from 'date-fns';

const ASSET_TYPES = ['LAPTOP', 'DESKTOP', 'MONITOR', 'KEYBOARD', 'MOUSE', 'PRINTER', 'PHONE', 'TABLET', 'SERVER', 'SWITCH', 'ROUTER', 'UPS', 'HEADSET', 'WEBCAM', 'DOCKING_STATION', 'OTHER'];
const ASSET_STATUSES = ['ACTIVE', 'IN_REPAIR', 'RETIRED', 'AVAILABLE', 'RESERVED'];

export default function AssetList() {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadAssets = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await assetsApi.list({
        page,
        limit: 20,
        search: search || undefined,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      } as Record<string, string | number>);
      setAssets(res.data.data);
      setMeta(res.data.meta as typeof meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter]);

  useEffect(() => {
    loadAssets(1);
  }, [loadAssets]);

  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  const isWarrantyExpiringSoon = (date?: string) => {
    if (!date) return false;
    return isAfter(parseISO(date), new Date()) && isAfter(subDays(parseISO(date), 30), new Date()) === false;
  };

  const isWarrantyExpired = (date?: string) => {
    if (!date) return false;
    return !isAfter(parseISO(date), new Date());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{meta.total} activo{meta.total !== 1 ? 's' : ''}</h2>
        {isIT && (
          <Link
            to="/assets/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Nuevo Activo
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, tag, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{ASSET_TYPE_LABELS[t as keyof typeof ASSET_TYPE_LABELS]}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {ASSET_STATUSES.map((s) => <option key={s} value={s}>{ASSET_STATUS_LABELS[s as keyof typeof ASSET_STATUS_LABELS]}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={8} /></div>
        ) : assets.length === 0 ? (
          <EmptyState
            title="No hay activos"
            description="No se encontraron activos con los filtros aplicados."
            action={
              isIT ? (
                <Link to="/assets/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                  Agregar activo
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Asset Tag</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Marca / Modelo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Asignado a</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Garantía</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((asset) => {
                  const currentAssignment = asset.assignments?.find((a) => !a.returnedAt);
                  const warrantyExpired = isWarrantyExpired(asset.warrantyExpiry);
                  const warrantySoon = !warrantyExpired && isWarrantyExpiringSoon(asset.warrantyExpiry);

                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-600 font-medium">{asset.assetTag}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{asset.name}</td>
                      <td className="px-4 py-3 text-gray-500">{ASSET_TYPE_LABELS[asset.type]}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {[asset.brand, asset.model].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', ASSET_STATUS_COLORS[asset.status])}>
                          {ASSET_STATUS_LABELS[asset.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {currentAssignment
                          ? `${currentAssignment.user.firstName} ${currentAssignment.user.lastName}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {asset.warrantyExpiry ? (
                          <span className={clsx('text-xs', warrantyExpired ? 'text-red-600 font-medium' : warrantySoon ? 'text-amber-600' : 'text-gray-500')}>
                            {warrantyExpired ? '⚠️ ' : warrantySoon ? '⚡ ' : ''}{formatDateShort(asset.warrantyExpiry)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/assets/${asset.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors inline-flex">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

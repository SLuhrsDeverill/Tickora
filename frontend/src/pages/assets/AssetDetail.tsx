import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Wrench, Ticket } from 'lucide-react';
import { assetsApi } from '../../api/assets.api';
import { usersApi } from '../../api/users.api';
import { formatDate, formatDateShort } from '../../utils/formatDate';
import { ASSET_TYPE_LABELS, ASSET_STATUS_LABELS, ASSET_STATUS_COLORS } from '../../utils/constants';
import type { Asset } from '../../types/asset.types';
import type { User as UserType } from '../../types/user.types';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignUserId, setAssignUserId] = useState('');
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maintForm, setMaintForm] = useState({ type: 'Preventivo', description: '', performedAt: new Date().toISOString().split('T')[0] });

  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  useEffect(() => {
    const load = async () => {
      try {
        const [assetRes, usersRes] = await Promise.all([
          assetsApi.get(id!),
          isIT ? usersApi.list({ limit: 100 } as Record<string, string | number>) : Promise.resolve(null),
        ]);
        setAsset(assetRes.data.data);
        if (usersRes) setUsers(usersRes.data.data);
      } catch {
        navigate('/assets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isIT, navigate]);

  const handleAssign = async () => {
    if (!assignUserId) return;
    try {
      const res = await assetsApi.assign(id!, assignUserId);
      setAsset((prev) => prev ? { ...prev, status: res.data.data.status } : prev);
      const assetRes = await assetsApi.get(id!);
      setAsset(assetRes.data.data);
      setAssignUserId('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async () => {
    if (!confirm('¿Desasignar este activo?')) return;
    try {
      await assetsApi.unassign(id!);
      const assetRes = await assetsApi.get(id!);
      setAsset(assetRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaintenance = async () => {
    try {
      await assetsApi.maintenance(id!, { ...maintForm, performedAt: new Date(maintForm.performedAt).toISOString() } as never);
      const assetRes = await assetsApi.get(id!);
      setAsset(assetRes.data.data);
      setShowMaintForm(false);
      setMaintForm({ type: 'Preventivo', description: '', performedAt: new Date().toISOString().split('T')[0] });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-xl" /></div>;
  if (!asset) return null;

  const currentAssignment = asset.assignments?.find((a) => !a.returnedAt);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/assets')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver a activos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-blue-600 text-sm font-medium">{asset.assetTag}</span>
                <h2 className="text-xl font-semibold text-gray-900 mt-1">{asset.name}</h2>
                <p className="text-gray-500 text-sm">{ASSET_TYPE_LABELS[asset.type]} — {[asset.brand, asset.model].filter(Boolean).join(' ')}</p>
              </div>
              <span className={clsx('inline-flex items-center px-3 py-1 rounded-full text-sm font-medium', ASSET_STATUS_COLORS[asset.status])}>
                {ASSET_STATUS_LABELS[asset.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {asset.serialNumber && <div><span className="text-gray-500">N° Serie:</span> <strong>{asset.serialNumber}</strong></div>}
              {asset.location && <div><span className="text-gray-500">Ubicación:</span> <strong>{asset.location}</strong></div>}
              {asset.purchaseDate && <div><span className="text-gray-500">Comprado:</span> <strong>{formatDateShort(asset.purchaseDate)}</strong></div>}
              {asset.purchasePrice && <div><span className="text-gray-500">Precio:</span> <strong>${asset.purchasePrice.toLocaleString()}</strong></div>}
              {asset.warrantyExpiry && <div><span className="text-gray-500">Garantía hasta:</span> <strong>{formatDateShort(asset.warrantyExpiry)}</strong></div>}
              {currentAssignment && (
                <div>
                  <span className="text-gray-500">Asignado a:</span>{' '}
                  <strong>{currentAssignment.user.firstName} {currentAssignment.user.lastName}</strong>
                </div>
              )}
            </div>

            {asset.notes && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <span className="font-medium">Notas: </span>{asset.notes}
              </div>
            )}
          </div>

          {/* Assignment history */}
          {asset.assignments && asset.assignments.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={16} /> Historial de asignaciones
              </h3>
              <div className="space-y-3">
                {asset.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.user.firstName} {a.user.lastName}</p>
                      <p className="text-xs text-gray-500">{a.user.email}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>Desde: {formatDateShort(a.assignedAt)}</p>
                      {a.returnedAt && <p>Hasta: {formatDateShort(a.returnedAt)}</p>}
                      {!a.returnedAt && <span className="text-green-600 font-medium">Activo</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance history */}
          {asset.maintenances && asset.maintenances.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Historial de mantenimientos</h3>
              <div className="space-y-3">
                {asset.maintenances.map((m) => (
                  <div key={m.id} className="border-b border-gray-50 last:border-0 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{m.type}</span>
                      <span className="text-xs text-gray-500">{formatDateShort(m.performedAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{m.description}</p>
                    {m.cost && <p className="text-xs text-gray-500 mt-1">Costo: ${m.cost}</p>}
                    {m.nextDue && <p className="text-xs text-amber-600 mt-1">Próximo: {formatDateShort(m.nextDue)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related tickets */}
          {(asset as unknown as { tickets?: Array<{ id: string; ticketNumber: string; title: string; status: string; createdAt: string }> }).tickets && (asset as unknown as { tickets: Array<{ id: string; ticketNumber: string; title: string; status: string; createdAt: string }> }).tickets.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket size={16} /> Tickets relacionados
              </h3>
              <div className="space-y-2">
                {(asset as unknown as { tickets: Array<{ id: string; ticketNumber: string; title: string; status: string; createdAt: string }> }).tickets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2">
                    <span className="font-mono text-blue-600 text-xs">{t.ticketNumber}</span>
                    <span className="text-sm text-gray-700 flex-1 mx-3">{t.title}</span>
                    <span className="text-xs text-gray-400">{formatDateShort(t.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions sidebar */}
        {isIT && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Acciones</h3>
              <div className="space-y-3">
                {/* Assign */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Asignar a usuario</label>
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar usuario...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                    ))}
                  </select>
                  {assignUserId && (
                    <button onClick={handleAssign} className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
                      Asignar
                    </button>
                  )}
                </div>

                {/* Unassign */}
                {currentAssignment && (
                  <button onClick={handleUnassign} className="w-full border border-red-300 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium transition-colors">
                    Liberar activo
                  </button>
                )}

                {/* Maintenance */}
                <button
                  onClick={() => setShowMaintForm(!showMaintForm)}
                  className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Registrar mantenimiento
                </button>

                {showMaintForm && (
                  <div className="space-y-3 border-t border-gray-100 pt-3">
                    <select
                      value={maintForm.type}
                      onChange={(e) => setMaintForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option>Preventivo</option>
                      <option>Correctivo</option>
                      <option>Actualización</option>
                      <option>Revisión</option>
                    </select>
                    <textarea
                      value={maintForm.description}
                      onChange={(e) => setMaintForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      placeholder="Descripción del mantenimiento..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    />
                    <input
                      type="date"
                      value={maintForm.performedAt}
                      onChange={(e) => setMaintForm((f) => ({ ...f, performedAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button onClick={handleMaintenance} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">
                      Guardar mantenimiento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, UserCheck, UserX } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { formatDate } from '../../utils/formatDate';
import type { User } from '../../types/user.types';
import { useAuthStore } from '../../store/auth.store';
import clsx from 'clsx';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  IT_AGENT: 'bg-blue-100 text-blue-700',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  IT_AGENT: 'Agente IT',
  EMPLOYEE: 'Empleado',
};

export default function UserList() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await usersApi.list({ page, limit: 20, search: search || '' } as Record<string, string | number>);
      setUsers(res.data.data);
      setMeta(res.data.meta as typeof meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const isAdmin = currentUser?.role === 'ADMIN';

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await usersApi.deactivate(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: false } : u));
    } catch { alert('Error al desactivar usuario'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{meta.total} usuario{meta.total !== 1 ? 's' : ''}</h2>
        {isAdmin && (
          <Link to="/users/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Usuario
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6"><LoadingSkeleton rows={8} /></div>
        ) : users.length === 0 ? (
          <EmptyState title="No hay usuarios" description="No se encontraron usuarios." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Departamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Creado</th>
                  {isAdmin && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                          {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/users/${u.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                            {u.firstName} {u.lastName}
                          </Link>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', ROLE_COLORS[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.department || '—'}</td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <UserCheck size={13} /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <UserX size={13} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {u.id !== currentUser?.id && u.isActive && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Desactivar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

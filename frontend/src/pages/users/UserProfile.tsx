import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Lock, Monitor } from 'lucide-react';
import { usersApi } from '../../api/users.api';
import { formatDate } from '../../utils/formatDate';
import type { User } from '../../types/user.types';
import { useAuthStore } from '../../store/auth.store';

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useAuthStore();
  const [user, setLocalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', department: '', position: '',
    phone: '', jobTitle: '', legacyNumber: '', hireDate: '',
    anyDeskId: '', teamViewerId: '', networkName: '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const profileId = id || currentUser?.id || '';
  const isOwnProfile = currentUser?.id === profileId;
  const isIT = currentUser?.role === 'ADMIN' || currentUser?.role === 'IT_AGENT';
  const canEdit = isOwnProfile || isIT;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await usersApi.get(profileId);
        const u = res.data.data;
        setLocalUser(u);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          department: u.department || '',
          position: u.position || '',
          phone: u.phone || '',
          jobTitle: u.jobTitle || '',
          legacyNumber: u.legacyNumber || '',
          hireDate: u.hireDate ? u.hireDate.split('T')[0] : '',
          anyDeskId: u.anyDeskId || '',
          teamViewerId: u.teamViewerId || '',
          networkName: u.networkName || '',
        });
      } catch {
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [profileId, navigate]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.hireDate) payload.hireDate = new Date(form.hireDate).toISOString();
      else payload.hireDate = null;
      const res = await usersApi.update(profileId, payload as Parameters<typeof usersApi.update>[1]);
      setLocalUser(res.data.data);
      if (isOwnProfile) setUser(res.data.data);
      setEditing(false);
      setSuccess('Perfil actualizado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.newPassword !== pwForm.confirm) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    setError('');
    try {
      await usersApi.changePassword(profileId, pwForm.currentPassword, pwForm.newPassword);
      setShowPw(false);
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setSuccess('Contraseña cambiada correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;
  if (!user) return null;

  const inp = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Volver
      </button>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {/* Profile card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{user.role}</span>
            </div>
          </div>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
              <Edit2 size={14} /> Editar
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Apellido</label>
                <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Departamento</label>
                <input value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cargo</label>
                <input value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Puesto / Job Title</label>
                <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Legajo</label>
                <input value={form.legacyNumber} onChange={(e) => setForm((f) => ({ ...f, legacyNumber: e.target.value }))} className={inp} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha de ingreso</label>
                <input type="date" value={form.hireDate} onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))} className={inp} />
              </div>
            </div>

            {isIT && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2 border-t border-gray-100">Acceso remoto</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">AnyDesk ID</label>
                    <input value={form.anyDeskId} onChange={(e) => setForm((f) => ({ ...f, anyDeskId: e.target.value }))} className={inp} placeholder="123 456 789" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">TeamViewer ID</label>
                    <input value={form.teamViewerId} onChange={(e) => setForm((f) => ({ ...f, teamViewerId: e.target.value }))} className={inp} placeholder="1 234 567 890" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de equipo</label>
                    <input value={form.networkName} onChange={(e) => setForm((f) => ({ ...f, networkName: e.target.value }))} className={inp} placeholder="PC-JDOE-01" />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <Save size={14} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {user.department && <div><span className="text-gray-500">Departamento:</span> <strong>{user.department}</strong></div>}
              {user.position && <div><span className="text-gray-500">Cargo:</span> <strong>{user.position}</strong></div>}
              {user.jobTitle && <div><span className="text-gray-500">Puesto:</span> <strong>{user.jobTitle}</strong></div>}
              {user.legacyNumber && <div><span className="text-gray-500">Legajo:</span> <strong>{user.legacyNumber}</strong></div>}
              {user.phone && <div><span className="text-gray-500">Teléfono:</span> <strong>{user.phone}</strong></div>}
              {user.hireDate && <div><span className="text-gray-500">Ingreso:</span> <strong>{formatDate(user.hireDate)}</strong></div>}
              <div><span className="text-gray-500">Miembro desde:</span> <strong>{formatDate(user.createdAt)}</strong></div>
              <div><span className="text-gray-500">Estado:</span> <strong className={user.isActive ? 'text-green-600' : 'text-red-500'}>{user.isActive ? 'Activo' : 'Inactivo'}</strong></div>
            </div>

            {isIT && (user.anyDeskId || user.teamViewerId || user.networkName) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">Acceso remoto</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {user.anyDeskId && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">AnyDesk ID</p>
                      <p className="font-mono font-semibold text-gray-900">{user.anyDeskId}</p>
                    </div>
                  )}
                  {user.teamViewerId && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">TeamViewer ID</p>
                      <p className="font-mono font-semibold text-gray-900">{user.teamViewerId}</p>
                    </div>
                  )}
                  {user.networkName && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Nombre de equipo</p>
                      <p className="font-mono font-semibold text-gray-900">{user.networkName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password change (own profile only) */}
      {isOwnProfile && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Lock size={16} /> Cambiar contraseña
            </h3>
            {!showPw && (
              <button onClick={() => setShowPw(true)} className="text-sm text-blue-600 hover:text-blue-700">Cambiar</button>
            )}
          </div>
          {showPw && (
            <div className="space-y-3">
              <input type="password" placeholder="Contraseña actual" value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className={inp} />
              <input type="password" placeholder="Nueva contraseña" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className={inp} />
              <input type="password" placeholder="Confirmar nueva contraseña" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} className={inp} />
              <div className="flex gap-2">
                <button onClick={handlePasswordChange} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  {saving ? 'Guardando...' : 'Actualizar contraseña'}
                </button>
                <button onClick={() => setShowPw(false)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

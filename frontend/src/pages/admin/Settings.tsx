import { useState, useEffect } from 'react';
import { settingsApi } from '../../api/settings.api';
import { Settings as SettingsIcon, Clock, Users, Bot, Mail, Save, Building } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'general' | 'sla' | 'departments' | 'bot' | 'email';

interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface BotStats {
  total: number;
  resolved: number;
  escalated: number;
  resolvedPercent: number;
  escalatedPercent: number;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
  { id: 'sla', label: 'SLA', icon: <Clock size={16} /> },
  { id: 'departments', label: 'Departamentos', icon: <Building size={16} /> },
  { id: 'bot', label: 'Bot de IA', icon: <Bot size={16} /> },
  { id: 'email', label: 'Email', icon: <Mail size={16} /> },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('general');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [botStats, setBotStats] = useState<BotStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '' });

  useEffect(() => {
    settingsApi.getAll().then((r) => setSettings(r.data.data));
    settingsApi.getDepartments().then((r) => setDepartments((r.data as { data: Department[] }).data));
    settingsApi.getBotStats().then((r) => setBotStats((r.data as { data: BotStats }).data));
  }, []);

  const set = (key: string, value: string) => setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.setMany(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDept = async () => {
    if (!newDept.name || !newDept.code) return;
    const res = await settingsApi.createDepartment(newDept.name, newDept.code);
    setDepartments((prev) => [...prev, (res.data as { data: Department }).data]);
    setNewDept({ name: '', code: '' });
  };

  const handleDeleteDept = async (id: string) => {
    await settingsApi.deleteDepartment(id);
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon size={24} className="text-slate-600" />
        <h1 className="text-2xl font-bold text-slate-800">Configuración del sistema</h1>
      </div>

      <div className="flex gap-6">
        {/* Tab list */}
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                  tab === t.id ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {tab === 'general' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-800 mb-4">Configuración general</h2>
              <Field label="Nombre de la empresa">
                <input className={inputCls} value={settings['company_name'] || ''} onChange={(e) => set('company_name', e.target.value)} />
              </Field>
              <Field label="Zona horaria">
                <input className={inputCls} value={settings['timezone'] || ''} onChange={(e) => set('timezone', e.target.value)} />
              </Field>
              <Field label="Idioma">
                <select className={inputCls} value={settings['language'] || 'es'} onChange={(e) => set('language', e.target.value)}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>
          )}

          {tab === 'sla' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-800 mb-4">Configuración de SLA</h2>
              {[
                { key: 'sla_critical_hours', label: 'Crítico', color: 'text-red-600' },
                { key: 'sla_high_hours', label: 'Alto', color: 'text-orange-600' },
                { key: 'sla_medium_hours', label: 'Medio', color: 'text-blue-600' },
                { key: 'sla_low_hours', label: 'Bajo', color: 'text-slate-600' },
              ].map(({ key, label, color }) => (
                <Field key={key} label={<span className={color}>{label}</span>}>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className={clsx(inputCls, 'w-24')}
                      value={settings[key] || ''}
                      onChange={(e) => set(key, e.target.value)}
                    />
                    <span className="text-sm text-slate-500">horas</span>
                  </div>
                </Field>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings['sla_pause_outside_hours'] === 'true'}
                    onChange={(e) => set('sla_pause_outside_hours', String(e.target.checked))}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">Pausar SLA fuera del horario laboral</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'departments' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-800 mb-4">Departamentos</h2>
              <div className="flex gap-2">
                <input className={clsx(inputCls, 'flex-1')} placeholder="Nombre" value={newDept.name} onChange={(e) => setNewDept((p) => ({ ...p, name: e.target.value }))} />
                <input className={clsx(inputCls, 'w-28')} placeholder="Código" value={newDept.code} onChange={(e) => setNewDept((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
                <button onClick={handleCreateDept} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
                  Agregar
                </button>
              </div>
              <div className="space-y-2 mt-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{dept.name}</p>
                      <p className="text-xs text-slate-500">{dept.code}</p>
                    </div>
                    <button onClick={() => handleDeleteDept(dept.id)} className="text-xs text-red-500 hover:text-red-700">
                      Eliminar
                    </button>
                  </div>
                ))}
                {departments.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No hay departamentos configurados</p>}
              </div>
            </div>
          )}

          {tab === 'bot' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-800 mb-4">Bot de IA — HelpBot</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings['bot_enabled'] === 'true'}
                  onChange={(e) => set('bot_enabled', String(e.target.checked))}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Activar HelpBot</span>
              </label>
              <Field label="Mensaje de bienvenida">
                <textarea
                  className={clsx(inputCls, 'h-20 resize-none')}
                  value={settings['bot_welcome_message'] || ''}
                  onChange={(e) => set('bot_welcome_message', e.target.value)}
                />
              </Field>
              {botStats && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h3 className="font-medium text-slate-700 mb-3">Estadísticas del bot</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <Stat label="Conversaciones" value={botStats.total} />
                    <Stat label="Resueltas sin escalar" value={`${botStats.resolvedPercent}%`} color="text-green-600" />
                    <Stat label="Escaladas a IT" value={`${botStats.escalatedPercent}%`} color="text-amber-600" />
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-800 mb-4">Configuración de email</h2>
              <Field label="Servidor SMTP">
                <input className={inputCls} value={settings['smtp_host'] || ''} onChange={(e) => set('smtp_host', e.target.value)} />
              </Field>
              <Field label="Puerto">
                <input type="number" className={clsx(inputCls, 'w-28')} value={settings['smtp_port'] || '587'} onChange={(e) => set('smtp_port', e.target.value)} />
              </Field>
              <Field label="Usuario SMTP">
                <input className={inputCls} value={settings['smtp_user'] || ''} onChange={(e) => set('smtp_user', e.target.value)} />
              </Field>
              <Field label="Remitente (FROM)">
                <input className={inputCls} value={settings['email_from'] || ''} onChange={(e) => set('email_from', e.target.value)} />
              </Field>
            </div>
          )}

          {/* Save button */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-sm text-green-600">✅ Guardado</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100';

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div>
      <p className={clsx('text-2xl font-bold', color || 'text-slate-800')}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

// Silence unused import warning for Users icon
void Users;

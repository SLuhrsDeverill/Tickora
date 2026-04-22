import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, BookOpen, ThumbsUp, ThumbsDown, Eye, Plus, ChevronLeft, Edit2, Save, X } from 'lucide-react';
import { knowledgeApi } from '../../api/knowledge.api';
import type { KBArticle } from '../../api/knowledge.api';
import { useAuthStore } from '../../store/auth.store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: 'Hardware', SOFTWARE: 'Software', NETWORK: 'Red',
  EMAIL: 'Email', PRINTER: 'Impresora', ACCESS_PERMISSIONS: 'Accesos',
  PHONE: 'Teléfono', OTHER: 'Otros',
};

const CATEGORY_COLORS: Record<string, string> = {
  HARDWARE: 'bg-orange-100 text-orange-700',
  SOFTWARE: 'bg-blue-100 text-blue-700',
  NETWORK: 'bg-purple-100 text-purple-700',
  EMAIL: 'bg-yellow-100 text-yellow-700',
  PRINTER: 'bg-pink-100 text-pink-700',
  ACCESS_PERMISSIONS: 'bg-red-100 text-red-700',
  PHONE: 'bg-teal-100 text-teal-700',
  OTHER: 'bg-slate-100 text-slate-700',
};

export default function KnowledgeBase() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<KBArticle | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', content: '', category: '', tags: '', isPublic: true });
  const [saving, setSaving] = useState(false);
  const isIT = user?.role === 'ADMIN' || user?.role === 'IT_AGENT';

  const load = async (q?: string, cat?: string) => {
    setLoading(true);
    try {
      const res = await knowledgeApi.list(q, cat);
      setArticles(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(search, category); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search, category);
  };

  const handleHelpful = async (id: string, helpful: boolean) => {
    if (helpful) await knowledgeApi.markHelpful(id);
    else await knowledgeApi.markNotHelpful(id);
    setArticles((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, helpful: helpful ? a.helpful + 1 : a.helpful, notHelpful: !helpful ? a.notHelpful + 1 : a.notHelpful }
          : a,
      ),
    );
    if (selected?.id === id) {
      setSelected((prev) =>
        prev
          ? { ...prev, helpful: helpful ? prev.helpful + 1 : prev.helpful, notHelpful: !helpful ? prev.notHelpful + 1 : prev.notHelpful }
          : null,
      );
    }
  };

  const startEdit = (article: KBArticle) => {
    setEditForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(', '),
      isPublic: article.isPublic,
    });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await knowledgeApi.update(selected.id, {
        title: editForm.title,
        content: editForm.content,
        category: editForm.category,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        isPublic: editForm.isPublic,
      });
      const updated = res.data.data;
      setSelected(updated);
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const inp = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100';

  if (selected) {
    const total = selected.helpful + selected.notHelpful;
    const pct = total > 0 ? Math.round((selected.helpful / total) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => { setSelected(null); setEditMode(false); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft size={16} /> Base de conocimiento
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {editMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Editando artículo</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex items-center gap-1.5 border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm"
                  >
                    <X size={14} /> Cancelar
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título</label>
                <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
                <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} className={inp}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Contenido (Markdown)</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  rows={16}
                  className={`${inp} font-mono text-xs resize-y`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tags (separados por coma)</label>
                <input value={editForm.tags} onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))} className={inp} placeholder="vpn, red, acceso" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" checked={editForm.isPublic} onChange={(e) => setEditForm((f) => ({ ...f, isPublic: e.target.checked }))} className="rounded border-slate-300" />
                Artículo público (visible para empleados)
              </label>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[selected.category] || 'bg-slate-100 text-slate-700'}`}>
                    {CATEGORY_LABELS[selected.category] || selected.category}
                  </span>
                  <h1 className="text-2xl font-bold text-slate-800 mt-2">{selected.title}</h1>
                  <p className="text-sm text-slate-500 mt-1">
                    {selected.views} vistas · Actualizado {format(new Date(selected.updatedAt), 'd MMM yyyy', { locale: es })}
                  </p>
                </div>
                {isIT && (
                  <button
                    onClick={() => startEdit(selected)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                  >
                    <Edit2 size={14} /> Editar artículo
                  </button>
                )}
              </div>

              <div className="prose prose-slate max-w-none text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-4">
                <span className="text-sm text-slate-500">¿Te resultó útil?</span>
                <button onClick={() => handleHelpful(selected.id, true)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-green-600 transition-colors">
                  <ThumbsUp size={16} /> <span>{selected.helpful}</span>
                </button>
                <button onClick={() => handleHelpful(selected.id, false)} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-500 transition-colors">
                  <ThumbsDown size={16} /> <span>{selected.notHelpful}</span>
                </button>
                {total > 0 && <span className="text-xs text-slate-400">{pct}% lo encontró útil</span>}
              </div>

              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">¿No encontraste lo que buscabas?</p>
                <button onClick={() => navigate('/tickets/new')} className="mt-2 text-sm text-blue-600 hover:underline font-medium">
                  Crear un ticket de soporte →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Base de conocimiento</h1>
          <p className="text-slate-500 text-sm mt-1">Soluciones documentadas para problemas comunes</p>
        </div>
        {isIT && (
          <button
            onClick={() => navigate('/knowledge/new')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} /> Nuevo artículo
          </button>
        )}
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            placeholder="Buscar en la base de conocimiento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          value={category}
          onChange={(e) => { setCategory(e.target.value); load(search, e.target.value); }}
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
          Buscar
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-4/5 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-full mb-1" />
              <div className="h-3 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No se encontraron artículos</p>
          <p className="text-sm mt-1">Intentá con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all relative group"
            >
              {isIT && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(article); startEdit(article); }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  title="Editar artículo"
                >
                  <Edit2 size={14} />
                </button>
              )}
              <div onClick={() => setSelected(article)} className="cursor-pointer">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] || 'bg-slate-100 text-slate-700'}`}>
                  {CATEGORY_LABELS[article.category] || article.category}
                </span>
                <h3 className="font-semibold text-slate-800 mt-2 mb-1 text-sm leading-snug">{article.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-3">
                  {article.content.replace(/[#*`]/g, '').slice(0, 120)}...
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Eye size={12} /> {article.views}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={12} /> {article.helpful}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

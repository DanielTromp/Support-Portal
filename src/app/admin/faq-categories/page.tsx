'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

interface FaqCategory {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

interface CategoryForm {
  name: string;
  slug: string;
}

const emptyForm: CategoryForm = { name: '', slug: '' };

export default function FaqCategoriesPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/faq-categories');
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setError('');
    if (!form.name || !form.slug) {
      setError('Name and slug are required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/faq-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowCreate(false);
    setForm(emptyForm);
    load();
  }

  async function handleUpdate() {
    setError('');
    if (!form.name || !form.slug) {
      setError('Name and slug are required');
      return;
    }
    setSaving(true);
    const body = { id: editingId, ...form };
    const res = await fetch('/api/admin/faq-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingId(null);
    setForm(emptyForm);
    load();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/faq-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  function startEdit(cat: FaqCategory) {
    setShowCreate(false);
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setShowCreate(false);
    setForm(emptyForm);
    setError('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQ Categories</h1>
        <button
          onClick={() => { setEditingId(null); setShowCreate(true); setForm(emptyForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90 transition-colors"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm transition-all">
          <h2 className="font-semibold text-gray-900 mb-4">New FAQ Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
            <input
              placeholder="Category Name"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm(f => ({
                   ...f, 
                   name, 
                   slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
                }));
              }}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
            <input
              placeholder="Slug (e.g. general-questions)"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Create
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && !showCreate && (
               <tr>
                 <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                   No categories found. Create your first category to organize FAQs.
                 </td>
               </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {editingId === c.id ? (
                  <>
                    <td className="px-4 py-3">
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={form.slug}
                        onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                       {new Date(c.created_at + 'Z').toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={handleUpdate}
                          disabled={saving}
                          className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900 w-1/3">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs w-1/3">{c.slug}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs w-1/6">
                      {new Date(c.created_at + 'Z').toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right w-1/6">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DbUser } from '@/types';
import { Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

interface UserForm {
  username: string;
  password: string;
  role: string;
}

const emptyForm: UserForm = { username: '', password: '', role: 'user' };

export default function UsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    setError('');
    if (!form.username || !form.password) {
      setError('Username and password are required');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/users', {
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
    if (!form.username) {
      setError('Username is required');
      return;
    }
    setSaving(true);
    const body: Record<string, unknown> = { id: editingId, username: form.username, role: form.role };
    if (form.password) body.password = form.password;
    const res = await fetch('/api/admin/users', {
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

  async function handleDelete(id: number, username: string) {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/users', {
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

  function startEdit(user: DbUser) {
    setShowCreate(false);
    setEditingId(user.id);
    setForm({ username: user.username, password: '', role: user.role });
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => { setEditingId(null); setShowCreate(true); setForm(emptyForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90"
        >
          <Plus size={16} />
          Add User
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">New User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Create
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                {editingId === u.id ? (
                  <>
                    <td className="px-4 py-3 text-gray-400">{u.id}</td>
                    <td className="px-4 py-3">
                      <input
                        value={form.username}
                        onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={form.role}
                        onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="password"
                        placeholder="New password (leave blank to keep)"
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={handleUpdate}
                          disabled={saving}
                          className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-gray-400">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.created_at + 'Z').toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
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

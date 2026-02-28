'use client';

import { useState, useEffect, useCallback } from 'react';
import { DbUser } from '@/types';
import { Plus, Pencil, Trash2, X, Check, Loader2, Key } from 'lucide-react';

interface UserForm {
  username: string;
  password?: string;
  role: string;
}

interface RoleForm {
  name: string;
  description: string;
  permissionsText: string;
}

const emptyUserForm: UserForm = { username: '', password: '', role: 'user' };
const emptyRoleForm: RoleForm = { name: '', description: '', permissionsText: '' };

export default function UsersAndRolesPage() {
  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data state
  const [users, setUsers] = useState<DbUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // User tab state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [savingUser, setSavingUser] = useState(false);

  // Role tab state
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);
  const [savingRole, setSavingRole] = useState(false);

  const loadData = useCallback(async () => {
    try {
       const [usersRes, rolesRes] = await Promise.all([
         fetch('/api/admin/users'),
         fetch('/api/admin/roles')
       ]);
       
       if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users || []);
       }
       if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
       }
    } catch (e) {
      console.error(e);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);


  // ============= USERS LOGIC =============
  async function handleCreateUser() {
    setError('');
    if (!userForm.username || !userForm.password) {
      setError('Username and password are required');
      return;
    }
    setSavingUser(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    });
    const data = await res.json();
    setSavingUser(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowCreateUser(false);
    setUserForm(emptyUserForm);
    loadData();
  }

  async function handleUpdateUser() {
    setError('');
    if (!userForm.username) {
      setError('Username is required');
      return;
    }
    setSavingUser(true);
    const body: Record<string, unknown> = { id: editingUserId, username: userForm.username, role: userForm.role };
    if (userForm.password) body.password = userForm.password;
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSavingUser(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingUserId(null);
    setUserForm(emptyUserForm);
    loadData();
  }

  async function handleDeleteUser(id: number, username: string) {
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
    loadData();
  }

  function startEditUser(user: DbUser) {
    setShowCreateUser(false);
    setEditingUserId(user.id);
    setUserForm({ username: user.username, password: '', role: user.role });
    setError('');
  }

  function cancelEditUser() {
    setEditingUserId(null);
    setShowCreateUser(false);
    setUserForm(emptyUserForm);
    setError('');
  }


  // ============= ROLES LOGIC =============
  async function handleCreateRole() {
    setError('');
    if (!roleForm.name) {
      setError('Role name is required');
      return;
    }
    setSavingRole(true);
    const body = { 
       name: roleForm.name, 
       description: roleForm.description,
       permissions_json: JSON.stringify(roleForm.permissionsText.split('\\n').map(p => p.trim()).filter(Boolean))
    };
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSavingRole(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setShowCreateRole(false);
    setRoleForm(emptyRoleForm);
    loadData();
  }

  async function handleUpdateRole() {
    setError('');
    if (!roleForm.name) {
      setError('Role name is required');
      return;
    }
    setSavingRole(true);
    const body = { 
       id: editingRoleId, 
       name: roleForm.name, 
       description: roleForm.description,
       permissions_json: JSON.stringify(roleForm.permissionsText.split('\\n').map(p => p.trim()).filter(Boolean))
    };
    const res = await fetch('/api/admin/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSavingRole(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setEditingRoleId(null);
    setRoleForm(emptyRoleForm);
    loadData();
  }

  async function handleDeleteRole(id: number, name: string) {
    if (!confirm(`Delete role "${name}"? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    loadData();
  }

  function startEditRole(role: any) {
    setShowCreateRole(false);
    setEditingRoleId(role.id);
    let perms = [];
    try {
        perms = JSON.parse(role.permissions_json);
    } catch {}

    setRoleForm({ 
       name: role.name, 
       description: role.description || '', 
       permissionsText: perms.join('\\n')
    });
    setError('');
  }

  function cancelEditRole() {
    setEditingRoleId(null);
    setShowCreateRole(false);
    setRoleForm(emptyRoleForm);
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
        <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 mb-6">
          <button
            onClick={() => { setTab('users'); setError(''); }}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              tab === 'users'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => { setTab('roles'); setError(''); }}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              tab === 'roles'
                ? 'border-brand-purple text-brand-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
             Roles
          </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ============== USERS TAB ============== */}
      {tab === 'users' && (
      <div>
         <div className="flex justify-end mb-4">
             <button
               onClick={() => { setEditingUserId(null); setShowCreateUser(true); setUserForm(emptyUserForm); setError(''); }}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90 transition-colors shadow-sm"
             >
               <Plus size={16} />
               Add User
             </button>
         </div>

         {/* Create form */}
         {showCreateUser && (
           <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 shadow-sm">
             <h2 className="font-semibold text-gray-900 mb-4">New User</h2>
             <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
               <input
                 placeholder="Username"
                 value={userForm.username}
                 onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
               />
               <input
                 type="password"
                 placeholder="Password"
                 value={userForm.password}
                 onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
               />
               <select
                 value={userForm.role}
                 onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                 className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
               >
                 {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                 ))}
               </select>
               <div className="flex gap-2">
                 <button
                   onClick={handleCreateUser}
                   disabled={savingUser}
                   className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                 >
                   {savingUser ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                   Create
                 </button>
                 <button
                   onClick={cancelEditUser}
                   className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                 >
                   <X size={14} />
                 </button>
               </div>
             </div>
           </div>
         )}
   
         {/* Users table */}
         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
           <table className="w-full text-sm">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Username</th>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                 <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
               </tr>
             </thead>
             <tbody>
               {users.map((u) => (
                 <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                   {editingUserId === u.id ? (
                     <>
                       <td className="px-4 py-3">
                         <input
                           value={userForm.username}
                           onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                           className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                         />
                       </td>
                       <td className="px-4 py-3">
                         <select
                           value={userForm.role}
                           onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                           className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                         >
                            {roles.map(r => (
                               <option key={r.id} value={r.name}>{r.name.charAt(0).toUpperCase() + r.name.slice(1)}</option>
                            ))}
                         </select>
                       </td>
                       <td className="px-4 py-3">
                         <input
                           type="password"
                           placeholder="New password (leave blank to keep)"
                           value={userForm.password}
                           onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                           className="rounded-lg border border-gray-200 px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                         />
                       </td>
                       <td className="px-4 py-3 text-right">
                         <div className="flex justify-end gap-1">
                           <button
                             onClick={handleUpdateUser}
                             disabled={savingUser}
                             className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                           >
                             {savingUser ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                           </button>
                           <button
                             onClick={cancelEditUser}
                             className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                           >
                             <X size={14} />
                           </button>
                         </div>
                       </td>
                     </>
                   ) : (
                     <>
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
                             onClick={() => startEditUser(u)}
                             className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                           >
                             <Pencil size={14} />
                           </button>
                           <button
                             onClick={() => handleDeleteUser(u.id, u.username)}
                             className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </td>
                     </>
                   )}
                 </tr>
               ))}
               {users.length === 0 && (
                 <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
      )}

      {/* ============== ROLES TAB ============== */}
      {tab === 'roles' && (
      <div>
         <div className="flex justify-end mb-4">
             <button
               onClick={() => { setEditingRoleId(null); setShowCreateRole(true); setRoleForm(emptyRoleForm); setError(''); }}
               className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-purple text-white text-sm hover:bg-brand-purple/90 transition-colors shadow-sm"
             >
               <Key size={16} />
               Add Role
             </button>
         </div>

         {/* Create/Edit Role form */}
         {(showCreateRole || editingRoleId !== null) && (
           <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
             <h2 className="font-semibold text-gray-900 mb-4">{showCreateRole ? 'New Role' : 'Edit Role'}</h2>
             
             <div className="flex flex-col gap-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Role Name (slug)</label>
                      <input
                        placeholder="e.g. trainer"
                        value={roleForm.name}
                        disabled={editingRoleId !== null && ['admin', 'user'].includes(roleForm.name)}
                        onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                      />
                   </div>
                   <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <input
                        placeholder="Access to training and chat history..."
                        value={roleForm.description}
                        onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                      />
                   </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700 mt-2">Allowed Routes / Endpoints (One per line)</label>
                    <p className="text-xs text-gray-500 mb-1">Enter absolute paths (e.g. `/admin/faqs`). Sub-paths are automatically allowed. Admin role uses `*`.</p>
                    <textarea
                      placeholder="/admin/faqs\n/admin/chat-history"
                      value={roleForm.permissionsText}
                      disabled={roleForm.name === 'admin'}
                      onChange={(e) => setRoleForm((f) => ({ ...f, permissionsText: e.target.value }))}
                      rows={5}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-purple/30 bg-white"
                    />
                 </div>
               
               <div className="flex gap-2 justify-end pt-3">
                 <button
                   onClick={cancelEditRole}
                   className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={showCreateRole ? handleCreateRole : handleUpdateRole}
                   disabled={savingRole || (editingRoleId !== null && ['admin', 'user'].includes(roleForm.name) && roleForm.name === 'admin')}
                   className="flex items-center gap-1.5 px-6 py-2 rounded-lg bg-green-600 font-medium text-white text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                 >
                   {savingRole ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                   {showCreateRole ? 'Create Role' : 'Save Changes'}
                 </button>
               </div>
             </div>
           </div>
         )}
   
         {/* Roles table */}
         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
           <table className="w-full text-sm">
             <thead className="bg-gray-50 border-b border-gray-200">
               <tr>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Description</th>
                 <th className="text-left px-4 py-3 font-medium text-gray-500">Permissions</th>
                 <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
               </tr>
             </thead>
             <tbody>
               {roles.map((r) => {
                 let perms: string[] = [];
                 try { perms = JSON.parse(r.permissions_json); } catch {}

                 return (
                 <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors items-start">
                    <td className="px-4 py-3 font-medium text-gray-900 align-top">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                         r.name === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-700'
                       }`}>
                         {r.name}
                       </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 align-top">{r.description}</td>
                    <td className="px-4 py-3 align-top max-w-xs">
                        <div className="flex flex-wrap gap-1">
                           {perms.map((p, idx) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-mono">{p}</span>
                           ))}
                           {perms.length === 0 && <span className="text-xs text-gray-400 italic">No access</span>}
                        </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => startEditRole(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(r.id, r.name)}
                          disabled={['admin', 'user'].includes(r.name)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                 </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      </div>
      )}
    </div>
  );
}

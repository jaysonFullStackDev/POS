'use client';
// app/dashboard/users/page.tsx
// Staff user management — admin only

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { User, UserRole } from '@/types';
import clsx from 'clsx';

const ROLE_COLORS: Record<UserRole, string> = {
  admin:   'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  cashier: 'bg-green-100 text-green-700',
};

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'cashier' as UserRole,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.auth.createUser(form);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-display font-bold text-espresso-900 text-lg mb-5">
          Add Staff Member
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Full Name</label>
            <input type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input" placeholder="e.g. Maria Santos" />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Email</label>
            <input type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input" placeholder="staff@yourshop.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">
              Password (min 8 characters)
            </label>
            <input type="password" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['cashier', 'manager', 'admin'] as UserRole[]).map(role => (
                <button key={role}
                  onClick={() => setForm(f => ({ ...f, role }))}
                  className={clsx('py-2 rounded-xl text-xs font-semibold capitalize transition-colors',
                    form.role === role
                      ? 'bg-brew-600 text-white'
                      : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            <p className="text-xs text-espresso-400 mt-2">
              {form.role === 'admin'   && '⚠️ Full access including user management'}
              {form.role === 'manager' && '📊 Inventory, accounting, and reports access'}
              {form.role === 'cashier' && '🛒 POS and dashboard only'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);

  const loadUsers = () => {
    api.auth.getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <AppShell requiredRole="admin">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-espresso-900">
            Staff Management
          </h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            + Add Staff
          </button>
        </div>

        {loading ? (
          <div className="card p-10 text-center animate-pulse text-espresso-400">Loading…</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-center px-4 py-3">Role</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="table-row-hover border-t border-brew-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brew-400 flex items-center
                                        justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-espresso-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-espresso-500">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('badge capitalize', ROLE_COLORS[user.role])}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={clsx('badge',
                        user.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-espresso-500 text-xs">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString('en-PH')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddUserModal onClose={() => setShowAdd(false)} onSaved={loadUsers} />
      )}
    </AppShell>
  );
}

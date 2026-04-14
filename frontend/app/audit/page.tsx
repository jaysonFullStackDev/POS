'use client';
// app/audit/page.tsx
// Audit Log viewer — admin only

import { useState, useEffect, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { AuditLog } from '@/types';
import clsx from 'clsx';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:               { label: 'Login',            color: 'bg-blue-100 text-blue-700' },
  create_sale:         { label: 'Sale',             color: 'bg-green-100 text-green-700' },
  create_user:         { label: 'User Created',     color: 'bg-purple-100 text-purple-700' },
  change_password:     { label: 'Password Changed', color: 'bg-amber-100 text-amber-700' },
  create_product:      { label: 'Product Created',  color: 'bg-teal-100 text-teal-700' },
  update_product:      { label: 'Product Updated',  color: 'bg-teal-50 text-teal-600' },
  delete_product:      { label: 'Product Deleted',  color: 'bg-red-100 text-red-700' },
  create_ingredient:   { label: 'Ingredient Added', color: 'bg-lime-100 text-lime-700' },
  update_ingredient:   { label: 'Ingredient Updated', color: 'bg-lime-50 text-lime-600' },
  stock_movement:      { label: 'Stock Movement',   color: 'bg-orange-100 text-orange-700' },
  create_expense:      { label: 'Expense Recorded', color: 'bg-pink-100 text-pink-700' },
  create_supplier:     { label: 'Supplier Added',   color: 'bg-indigo-100 text-indigo-700' },
  update_order_status: { label: 'Order Updated',    color: 'bg-cyan-100 text-cyan-700' },
};

const ACTIONS = Object.keys(ACTION_LABELS);

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const limit = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (actionFilter) params.action = actionFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const data = await api.audit.logs(params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [actionFilter, fromDate, toDate]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const formatDetails = (details: Record<string, any> | undefined) => {
    if (!details || Object.keys(details).length === 0) return '';
    return Object.entries(details)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  };

  return (
    <AppShell requiredRole="admin">
      <div className="p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-espresso-900">
            Audit Log
          </h1>
          <p className="text-sm text-espresso-500">
            {total} total event{total !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filters */}
        <div className="card p-3 sm:p-4 mb-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-end">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="input py-1.5 text-sm w-full sm:w-44"
            >
              <option value="">All actions</option>
              {ACTIONS.map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="input py-1.5 text-sm w-full sm:w-36" />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="input py-1.5 text-sm w-full sm:w-36" />
          </div>
          {(actionFilter || fromDate || toDate) && (
            <button
              onClick={() => { setActionFilter(''); setFromDate(''); setToDate(''); }}
              className="text-xs text-red-500 hover:text-red-700 pb-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-brew-50 text-espresso-700 text-left">
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-espresso-400">
                      Loading...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-espresso-400">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
                    return (
                      <tr key={log.id} className="table-row-hover border-t border-brew-50">
                        <td className="px-4 py-3 text-espresso-500 whitespace-nowrap text-xs">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-espresso-800 font-medium">{log.user_name || '—'}</div>
                          <div className="text-xs text-espresso-400 capitalize">{log.user_role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge text-xs', actionInfo.color)}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-espresso-600 text-xs max-w-xs truncate">
                          {formatDetails(log.details)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-brew-100">
              <p className="text-xs text-espresso-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary text-xs py-1 px-3 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

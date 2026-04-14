'use client';
// app/dashboard/page.tsx

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/store/AuthContext';
import { api } from '@/lib/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import type { DashboardStats, CashFlowMonth } from '@/types';

const fmt = (n: number) =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string;
  sub?: string; color: string;
}) {
  return (
    <div className={`card p-4 sm:p-5 border-l-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-espresso-500 uppercase tracking-wide font-medium">
            {label}
          </p>
          <p className="text-lg sm:text-2xl font-display font-bold text-espresso-900 mt-1">
            {value}
          </p>
          {sub && <p className="text-xs text-espresso-400 mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState<DashboardStats | null>(null);
  const [cashflow, setCashflow] = useState<CashFlowMonth[]>([]);
  const [loading,  setLoading]  = useState(true);
  const { canManage } = useAuth();

  useEffect(() => {
    api.reports.dashboard()
      .then(s => setStats(s))
      .catch(console.error);

    if (canManage) {
      api.accounting.cashflow({ year: String(new Date().getFullYear()) })
        .then(cf => setCashflow(cf.cashflow || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AppShell>
      <div className="p-3 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-espresso-900">
            Dashboard
          </h1>
          <p className="text-espresso-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-PH', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="card p-5 h-28 animate-pulse bg-brew-100" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon="💸"
                label="Today's Revenue"
                value={fmt(stats?.today.revenue || 0)}
                sub={`${stats?.today.transactions || 0} transactions`}
                color="border-brew-500"
              />
              <StatCard
                icon="📅"
                label="This Month"
                value={fmt(stats?.this_month.revenue || 0)}
                color="border-blue-400"
              />
              <StatCard
                icon="⚠️"
                label="Low Stock Items"
                value={String(stats?.low_stock_count || 0)}
                sub="Need restocking"
                color={stats?.low_stock_count ? 'border-red-400' : 'border-green-400'}
              />
              <StatCard
                icon="🏆"
                label="Top Product Today"
                value={stats?.top_product_today?.product_name || '—'}
                sub={stats?.top_product_today
                  ? `${stats.top_product_today.units} units`
                  : 'No sales yet'}
                color="border-yellow-400"
              />
            </div>

            {canManage && <div className="card p-5 mb-6">
              <h2 className="font-display font-semibold text-espresso-800 mb-4">
                Revenue vs Expenses — {new Date().getFullYear()}
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={cashflow} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#c97f3a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#c97f3a" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1d9bc" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7d4120' }} />
                  <YAxis tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'}
                         tick={{ fontSize: 11, fill: '#7d4120' }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue"  stroke="#c97f3a" strokeWidth={2}
                        fill="url(#revenue)"  name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2}
                        fill="url(#expenses)" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>}

            {canManage && <div className="card p-5">
              <h2 className="font-display font-semibold text-espresso-800 mb-4">
                Monthly Net Profit
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashflow} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1d9bc" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7d4120' }} />
                  <YAxis tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'}
                         tick={{ fontSize: 11, fill: '#7d4120' }} />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="net" name="Net Profit"
                       fill="#c97f3a" radius={[6, 6, 0, 0]}
                       // Red bars for negative months
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>}
          </>
        )}
      </div>
    </AppShell>
  );
}

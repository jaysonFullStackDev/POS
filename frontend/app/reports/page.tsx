'use client';
// app/reports/page.tsx

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { SalesSummaryRow, TopProduct } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import clsx from 'clsx';

const fmt = (n: number) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

type Period = 'daily' | 'weekly' | 'monthly';
type Tab    = 'sales' | 'products' | 'inventory';

export default function ReportsPage() {
  const [tab,      setTab]      = useState<Tab>('sales');
  const [period,   setPeriod]   = useState<Period>('monthly');
  const [summary,  setSummary]  = useState<SalesSummaryRow[]>([]);
  const [topProds, setTopProds] = useState<TopProduct[]>([]);
  const [invUsage, setInvUsage] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(0);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = () => {
    setLoading(true);
    const year = String(new Date(from).getFullYear());

    Promise.all([
      api.reports.salesSummary({ period, year }),
      api.reports.topProducts({ from, to, limit: '10' }),
      api.reports.inventoryUsage({ from, to }),
    ])
      .then(([sum, top, inv]) => {
        setSummary(sum.slice(0, 30).reverse());
        setTopProds(top);
        setInvUsage(inv);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [period, from, to]);

  return (
    <AppShell requiredRole="manager">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-espresso-900">Reports & Analytics</h1>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
          <div className="flex gap-1">
            {(['daily','weekly','monthly'] as Period[]).map(p => (
              <button key={p}
                onClick={() => setPeriod(p)}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                  period === p ? 'bg-brew-600 text-white' : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center ml-auto">
            <label className="text-sm text-espresso-500">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-36" />
            <label className="text-sm text-espresso-500">To</label>
            <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input w-36" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {([
            { key: 'sales',     label: '📈 Sales Trend'    },
            { key: 'products',  label: '🏆 Top Products'   },
            { key: 'inventory', label: '🧪 Ingredient Use' },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                tab === t.key ? 'bg-brew-600 text-white' : 'bg-white text-espresso-600 border border-brew-200 hover:bg-brew-50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-center animate-pulse text-espresso-400">Loading…</div>
        ) : (
          <>
            {/* ── Sales trend ── */}
            {tab === 'sales' && (
              <div className="space-y-5">
                {/* Chart */}
                <div className="card p-5">
                  <h2 className="font-display font-semibold text-espresso-800 mb-4">
                    Revenue Trend ({period})
                  </h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={summary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1d9bc" />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#7d4120' }}
                             interval={period === 'daily' ? 6 : 0} />
                      <YAxis tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'}
                             tick={{ fontSize: 11, fill: '#7d4120' }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" name="Revenue"
                            stroke="#c97f3a" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="avg_transaction" name="Avg Transaction"
                            stroke="#4A90D9" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Summary table */}
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3">Period</th>
                        <th className="text-right px-4 py-3">Transactions</th>
                        <th className="text-right px-4 py-3">Revenue</th>
                        <th className="text-right px-4 py-3">Discounts</th>
                        <th className="text-right px-4 py-3">VAT</th>
                        <th className="text-right px-4 py-3">Avg. Sale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...summary].reverse().map((row, i) => (
                        <tr key={i} className="table-row-hover border-t border-brew-50">
                          <td className="px-4 py-2.5 font-medium text-espresso-800">{row.period}</td>
                          <td className="px-4 py-2.5 text-right text-espresso-600">{row.transaction_count}</td>
                          <td className="px-4 py-2.5 text-right font-semibold">{fmt(row.revenue)}</td>
                          <td className="px-4 py-2.5 text-right text-green-600">{fmt(row.discounts)}</td>
                          <td className="px-4 py-2.5 text-right text-espresso-500">{fmt(row.tax)}</td>
                          <td className="px-4 py-2.5 text-right text-espresso-500">
                            {fmt(Number(row.avg_transaction))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Top products ── */}
            {tab === 'products' && (
              <div className="space-y-5">
                <div className="card p-5">
                  <h2 className="font-display font-semibold text-espresso-800 mb-4">
                    Top 10 Products by Units Sold
                  </h2>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={topProds} layout="vertical" margin={{ left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1d9bc" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#7d4120' }} />
                      <YAxis dataKey="product_name" type="category"
                             tick={{ fontSize: 11, fill: '#7d4120' }} width={110} />
                      <Tooltip formatter={(v: number, name: string) =>
                        name === 'revenue' ? fmt(v) : v
                      } />
                      <Legend />
                      <Bar dataKey="units_sold" name="Units Sold" fill="#c97f3a" radius={[0,4,4,0]} />
                      <Bar dataKey="revenue"    name="Revenue"    fill="#4A90D9" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3">#</th>
                        <th className="text-left px-4 py-3">Product</th>
                        <th className="text-right px-4 py-3">Units Sold</th>
                        <th className="text-right px-4 py-3">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProds.map((p, i) => (
                        <tr key={i} className="table-row-hover border-t border-brew-50">
                          <td className="px-4 py-2.5 text-espresso-400 font-mono">{i + 1}</td>
                          <td className="px-4 py-2.5 font-medium text-espresso-800">{p.product_name}</td>
                          <td className="px-4 py-2.5 text-right font-bold">{p.units_sold}</td>
                          <td className="px-4 py-2.5 text-right text-brew-600 font-semibold">
                            {fmt(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Inventory usage ── */}
            {tab === 'inventory' && (
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-brew-100">
                  <h2 className="font-display font-semibold text-espresso-800">
                    Ingredient Consumption & COGS
                  </h2>
                  <p className="text-xs text-espresso-400 mt-1">
                    Based on sales deductions in selected period
                  </p>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-3">Ingredient</th>
                      <th className="text-right px-4 py-3">Total Used</th>
                      <th className="text-right px-4 py-3">Unit</th>
                      <th className="text-right px-4 py-3">Cost/Unit</th>
                      <th className="text-right px-4 py-3">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invUsage.map((row, i) => (
                      <tr key={i} className="table-row-hover border-t border-brew-50">
                        <td className="px-4 py-2.5 font-medium text-espresso-800">{row.name}</td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {Number(row.total_used).toFixed(1)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-espresso-500">{row.unit}</td>
                        <td className="px-4 py-2.5 text-right text-espresso-500">
                          {fmt(row.cost_per_unit)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-red-600">
                          {fmt(row.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {invUsage.length > 0 && (
                    <tfoot className="bg-brew-50 font-semibold">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-espresso-700">
                          Total COGS
                        </td>
                        <td className="px-4 py-3 text-right text-red-700 text-base">
                          {fmt(invUsage.reduce((s, r) => s + parseFloat(r.total_cost), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                {invUsage.length === 0 && (
                  <p className="text-center py-8 text-espresso-400 text-sm">No data in this period</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

'use client';
// app/accounting/page.tsx

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { Expense, PnLReport, ExpenseCategory } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import clsx from 'clsx';

const fmt = (n: number) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

type Tab = 'pnl' | 'expenses';

const EXPENSE_COLORS: Record<string, string> = {
  ingredients: '#c97f3a',
  utilities:   '#4A90D9',
  salaries:    '#9B59B6',
  rent:        '#E67E22',
  equipment:   '#2ECC71',
  marketing:   '#E91E63',
  other:       '#95A5A6',
};

const EXPENSE_CATS: ExpenseCategory[] = [
  'ingredients','utilities','salaries','rent','equipment','marketing','other'
];

// ── Add Expense Modal ─────────────────────────────────────
function AddExpenseModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    category:    'ingredients' as ExpenseCategory,
    description: '',
    amount:      '',
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) return;
    setBusy(true);
    try {
      await api.accounting.expenses.create({
        ...form,
        amount: parseFloat(form.amount),
      });
      onSaved();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-display font-bold text-espresso-900 mb-4">Record Expense</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
              className="input capitalize"
            >
              {EXPENSE_CATS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Description</label>
            <input type="text" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input" placeholder="e.g. Electricity bill – April" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Amount (₱)</label>
              <input type="number" min="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Date</label>
              <input type="date" value={form.expense_date}
                onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))}
                className="input" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave}
            disabled={busy || !form.description || !form.amount}
            className="btn-primary flex-1">
            {busy ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function AccountingPage() {
  const [tab,      setTab]      = useState<Tab>('pnl');
  const [pnl,      setPnl]      = useState<PnLReport | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [from,     setFrom]     = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.accounting.pnl({ from, to }),
      api.accounting.expenses.list({ from, to }),
    ])
      .then(([p, e]) => { setPnl(p); setExpenses(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [from, to]);

  return (
    <AppShell requiredRole="manager">
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold text-espresso-900">Accounting</h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">
            + Record Expense
          </button>
        </div>

        {/* Date range filter */}
        <div className="card p-4 mb-5 flex gap-3 items-center">
          <label className="text-sm text-espresso-600 font-medium">Period:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-40" />
          <span className="text-espresso-400">to</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input w-40" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['pnl', 'expenses'] as Tab[]).map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                tab === t ? 'bg-brew-600 text-white' : 'bg-white text-espresso-600 border border-brew-200 hover:bg-brew-50'
              )}
            >
              {t === 'pnl' ? '📊 P&L Report' : '💸 Expenses List'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-center text-espresso-400 animate-pulse">Loading…</div>
        ) : (
          <>
            {/* ── P&L tab ── */}
            {tab === 'pnl' && pnl && (
              <div className="space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Gross Sales',     value: fmt(pnl.gross_sales),    color: 'border-blue-400',  icon: '💵' },
                    { label: 'Net Revenue',      value: fmt(pnl.net_revenue),    color: 'border-green-400', icon: '📈' },
                    { label: 'Total Expenses',   value: fmt(pnl.total_expenses), color: 'border-red-400',   icon: '📉' },
                    { label: 'Gross Profit',     value: fmt(pnl.gross_profit),   color: 'border-brew-500',  icon: '🏆',
                      sub: `${pnl.profit_margin}% margin` },
                  ].map(card => (
                    <div key={card.label}
                      className={`card p-4 border-l-4 ${card.color}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-espresso-500 uppercase tracking-wide">{card.label}</p>
                          <p className={clsx('text-xl font-bold font-display mt-1',
                            card.label === 'Gross Profit'
                              ? pnl.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'
                              : 'text-espresso-900'
                          )}>
                            {card.value}
                          </p>
                          {(card as any).sub && (
                            <p className="text-xs text-espresso-400 mt-0.5">{(card as any).sub}</p>
                          )}
                        </div>
                        <span className="text-xl">{card.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expenses breakdown chart */}
                <div className="card p-5">
                  <h2 className="font-display font-semibold text-espresso-800 mb-4">
                    Expenses by Category
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={pnl.expenses_by_category}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1d9bc" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#7d4120' }} />
                      <YAxis tickFormatter={v => '₱' + (v/1000).toFixed(0) + 'k'}
                             tick={{ fontSize: 11, fill: '#7d4120' }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="total" radius={[6,6,0,0]}>
                        {pnl.expenses_by_category.map((e, i) => (
                          <Cell key={i} fill={EXPENSE_COLORS[e.category] || '#95A5A6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* P&L table */}
                <div className="card p-5">
                  <h2 className="font-display font-semibold text-espresso-800 mb-3">Income Statement</h2>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-brew-50">
                      <tr><td className="py-2 text-espresso-700">Gross Sales</td>
                          <td className="py-2 text-right font-medium">{fmt(pnl.gross_sales)}</td></tr>
                      <tr><td className="py-2 text-espresso-500 pl-4">Less: Discounts</td>
                          <td className="py-2 text-right text-red-500">({fmt(pnl.total_discounts)})</td></tr>
                      <tr><td className="py-2 text-espresso-500 pl-4">Add: VAT Collected</td>
                          <td className="py-2 text-right">{fmt(pnl.total_tax)}</td></tr>
                      <tr className="font-semibold bg-brew-50">
                          <td className="py-2 px-2 rounded-l">Net Revenue</td>
                          <td className="py-2 px-2 text-right rounded-r">{fmt(pnl.net_revenue)}</td></tr>
                      {pnl.expenses_by_category.map(e => (
                        <tr key={e.category}>
                          <td className="py-1.5 text-espresso-500 pl-4 capitalize">Less: {e.category}</td>
                          <td className="py-1.5 text-right text-red-500">({fmt(e.total)})</td>
                        </tr>
                      ))}
                      <tr className={clsx('font-bold text-base',
                        pnl.gross_profit >= 0 ? 'text-green-700' : 'text-red-600'
                      )}>
                        <td className="py-3 border-t-2 border-brew-300">Gross Profit</td>
                        <td className="py-3 text-right border-t-2 border-brew-300">{fmt(pnl.gross_profit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Expenses list tab ── */}
            {tab === 'expenses' && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Category</th>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-right px-4 py-3">Amount</th>
                      <th className="text-left px-4 py-3">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="table-row-hover border-t border-brew-50">
                        <td className="px-4 py-2.5 text-espresso-500 text-xs">
                          {new Date(e.expense_date).toLocaleDateString('en-PH')}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="badge capitalize"
                            style={{
                              backgroundColor: EXPENSE_COLORS[e.category] + '20',
                              color: EXPENSE_COLORS[e.category]
                            }}>
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-espresso-800">{e.description}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-espresso-900">
                          {fmt(e.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-espresso-500 text-xs">
                          {e.recorded_by_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expenses.length === 0 && (
                  <p className="text-center py-8 text-espresso-400 text-sm">No expenses in this period</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <AddExpenseModal onClose={() => setShowAdd(false)} onSaved={loadData} />
      )}
    </AppShell>
  );
}

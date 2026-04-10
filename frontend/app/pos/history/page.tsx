'use client';
// app/pos/history/page.tsx
// Sales transaction history — viewable by all roles

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { Sale } from '@/types';
import clsx from 'clsx';

const fmt = (n: number) =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ── Receipt Detail Modal ──────────────────────────────────
function SaleDetailModal({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.sales.get(saleId)
      .then(setSale)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [saleId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        {loading ? (
          <div className="text-center py-8 text-espresso-400 animate-pulse">Loading receipt…</div>
        ) : sale ? (
          <>
            <div className="text-center mb-4">
              <h2 className="font-display font-bold text-espresso-900 text-xl">☕ BrewPOS</h2>
              <p className="font-mono text-sm text-espresso-500 mt-1">{sale.sale_number}</p>
            </div>

            {/* Meta */}
            <div className="border-t border-dashed border-brew-200 py-3 space-y-1 text-sm">
              <div className="flex justify-between text-espresso-500">
                <span>Date</span>
                <span>{new Date(sale.created_at).toLocaleString('en-PH')}</span>
              </div>
              <div className="flex justify-between text-espresso-500">
                <span>Cashier</span><span>{sale.cashier_name || '—'}</span>
              </div>
              <div className="flex justify-between text-espresso-500 capitalize">
                <span>Payment</span><span>{sale.payment_method}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-dashed border-brew-200 py-3 space-y-2">
              {sale.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-espresso-700">
                    {item.product_name} <span className="text-espresso-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium">{fmt(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-brew-200 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-espresso-600">
                <span>Subtotal</span><span>{fmt(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span><span>-{fmt(sale.discount)}</span>
                </div>
              )}
              {sale.tax_amount > 0 && (
                <div className="flex justify-between text-espresso-500">
                  <span>VAT (12%)</span><span>{fmt(sale.tax_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-espresso-900 pt-1">
                <span>TOTAL</span><span className="text-brew-700">{fmt(sale.total_amount)}</span>
              </div>
              {sale.payment_method === 'cash' && (
                <>
                  <div className="flex justify-between text-espresso-500">
                    <span>Cash</span><span>{fmt(sale.amount_tendered || 0)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Change</span><span>{fmt(sale.change_due)}</span>
                  </div>
                </>
              )}
            </div>

            {sale.notes && (
              <p className="mt-3 text-xs text-espresso-400 italic border-t border-brew-100 pt-3">
                Note: {sale.notes}
              </p>
            )}
          </>
        ) : (
          <p className="text-center text-espresso-400">Sale not found</p>
        )}

        <div className="flex gap-3 mt-6">
          {sale && (
            <button onClick={() => window.print()} className="btn-secondary flex-1 text-sm">
              🖨️ Print
            </button>
          )}
          <button onClick={onClose} className="btn-primary flex-1 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function SalesHistoryPage() {
  const [sales,     setSales]     = useState<Sale[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to,   setTo]   = useState(() => new Date().toISOString().slice(0, 10));

  const loadSales = () => {
    setLoading(true);
    api.sales.list({ from, to })
      .then(setSales)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSales(); }, [from, to]);

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total_amount), 0);

  const pmColor = (pm: string) =>
    pm === 'cash' ? 'bg-green-100 text-green-700' :
    pm === 'card' ? 'bg-blue-100 text-blue-700' :
    'bg-purple-100 text-purple-700';

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-espresso-900 mb-6">
          Sales History
        </h1>

        {/* Filters */}
        <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
          <label className="text-sm text-espresso-600 font-medium">Date range:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-36" />
          <span className="text-espresso-400 text-sm">to</span>
          <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className="input w-36" />

          {/* Summary */}
          {!loading && (
            <div className="ml-auto flex gap-4">
              <div className="text-right">
                <p className="text-xs text-espresso-400 uppercase tracking-wide">Transactions</p>
                <p className="text-lg font-bold text-espresso-900">{sales.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-espresso-400 uppercase tracking-wide">Total Revenue</p>
                <p className="text-lg font-bold text-brew-700">{fmt(totalRevenue)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-espresso-400 animate-pulse">Loading sales…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Receipt #</th>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">Cashier</th>
                  <th className="text-center px-4 py-3">Payment</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id}
                    className="table-row-hover border-t border-brew-50 cursor-pointer"
                    onClick={() => setSelected(sale.id)}>
                    <td className="px-4 py-2.5 font-mono text-xs text-espresso-700">
                      {sale.sale_number}
                    </td>
                    <td className="px-4 py-2.5 text-espresso-500 text-xs">
                      {new Date(sale.created_at).toLocaleTimeString('en-PH', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-espresso-700">{sale.cashier_name || '—'}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={clsx('badge capitalize', pmColor(sale.payment_method))}>
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-espresso-900">
                      {fmt(sale.total_amount)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs text-brew-500 hover:text-brew-700">View ›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && sales.length === 0 && (
            <div className="p-10 text-center text-espresso-400">
              <p className="text-3xl mb-2">📭</p>
              <p>No sales found for this period</p>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <SaleDetailModal saleId={selected} onClose={() => setSelected(null)} />
      )}
    </AppShell>
  );
}

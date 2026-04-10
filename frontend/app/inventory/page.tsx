'use client';
// app/inventory/page.tsx

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { Ingredient, StockMovement, Supplier } from '@/types';
import clsx from 'clsx';

const fmt = (n: number) => '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

type Tab = 'ingredients' | 'movements' | 'suppliers';

// ── Add Ingredient Modal ─────────────────────────────────
function AddIngredientModal({
  suppliers, onClose, onSaved
}: {
  suppliers: Supplier[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', unit: 'g', stock_qty: '', low_stock_alert: '100',
    cost_per_unit: '', supplier_id: '',
  });
  const [busy, setBusy] = useState(false);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name || !form.unit) return;
    setBusy(true);
    try {
      await api.inventory.ingredients.create({
        name: form.name,
        unit: form.unit,
        stock_qty: parseFloat(form.stock_qty) || 0,
        low_stock_alert: parseFloat(form.low_stock_alert) || 100,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        supplier_id: form.supplier_id || null,
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-espresso-900 mb-4">Add Ingredient</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              className="input" placeholder="e.g. Oat Milk" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Unit</label>
              <select value={form.unit} onChange={e => set('unit', e.target.value)} className="input">
                {['g', 'ml', 'pcs', 'kg', 'L'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Initial Stock</label>
              <input type="number" min="0" value={form.stock_qty} onChange={e => set('stock_qty', e.target.value)}
                className="input" placeholder="0" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Low Stock Alert</label>
              <input type="number" min="0" value={form.low_stock_alert} onChange={e => set('low_stock_alert', e.target.value)}
                className="input" placeholder="100" />
            </div>
            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Cost/Unit (₱)</label>
              <input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => set('cost_per_unit', e.target.value)}
                className="input" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Supplier</label>
            <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className="input">
              <option value="">None</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={busy || !form.name}
            className="btn-primary flex-1">
            {busy ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Stock Movement Modal ─────────────────────────────
function StockModal({
  ingredient, onClose, onSaved
}: {
  ingredient: Ingredient;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type,  setType]  = useState<'purchase' | 'wastage' | 'adjustment'>('purchase');
  const [qty,   setQty]   = useState('');
  const [notes, setNotes] = useState('');
  const [busy,  setBusy]  = useState(false);

  const handleSave = async () => {
    if (!qty) return;
    setBusy(true);
    try {
      await api.inventory.addMovement({
        ingredient_id:  ingredient.id,
        movement_type:  type,
        quantity_change: parseFloat(qty),
        notes,
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-espresso-900 mb-1">
          Adjust Stock
        </h3>
        <p className="text-sm text-espresso-500 mb-4">
          {ingredient.name} — Current: {ingredient.stock_qty} {ingredient.unit}
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['purchase', 'wastage', 'adjustment'] as const).map(t => (
                <button key={t}
                  onClick={() => setType(t)}
                  className={clsx('py-2 rounded-xl text-xs font-semibold capitalize',
                    type === t ? 'bg-brew-600 text-white' : 'bg-brew-50 text-brew-700'
                  )}
                >
                  {t === 'purchase' ? '📦' : t === 'wastage' ? '🗑️' : '⚖️'} {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">
              Quantity ({ingredient.unit})
            </label>
            <input type="number" min="0" value={qty}
              onChange={e => setQty(e.target.value)}
              className="input" placeholder="Enter amount…" />
          </div>

          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Notes</label>
            <input type="text" value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input" placeholder="Optional note…" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={busy || !qty}
            className="btn-primary flex-1">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function InventoryPage() {
  const [tab,         setTab]         = useState<Tab>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements,   setMovements]   = useState<StockMovement[]>([]);
  const [suppliers,   setSuppliers]   = useState<Supplier[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [showAddIng,  setShowAddIng]  = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.inventory.ingredients.list(),
      api.inventory.movements(),
      api.inventory.suppliers.list(),
    ])
      .then(([ings, movs, sups]) => {
        setIngredients(ings);
        setMovements(movs);
        setSuppliers(sups);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const lowStockCount = ingredients.filter(i => i.is_low_stock).length;

  return (
    <AppShell requiredRole="manager">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-espresso-900">Inventory</h1>
            {lowStockCount > 0 && (
              <p className="text-sm text-red-500 mt-1">
                ⚠️ {lowStockCount} item{lowStockCount !== 1 ? 's' : ''} below low-stock threshold
              </p>
            )}
          </div>
          <button onClick={() => setShowAddIng(true)} className="btn-primary text-sm">
            + Add Ingredient
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(['ingredients', 'movements', 'suppliers'] as Tab[]).map(t => (
            <button key={t}
              onClick={() => setTab(t)}
              className={clsx('px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors',
                tab === t ? 'bg-brew-600 text-white' : 'bg-white text-espresso-600 border border-brew-200 hover:bg-brew-50'
              )}
            >
              {t === 'ingredients' ? '🧪 Ingredients' : t === 'movements' ? '📋 Stock Log' : '🏭 Suppliers'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card p-8 text-center text-espresso-400 animate-pulse">Loading…</div>
        ) : (
          <>
            {/* ── Ingredients tab ── */}
            {tab === 'ingredients' && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-3">Ingredient</th>
                      <th className="text-right px-4 py-3">Stock</th>
                      <th className="text-right px-4 py-3">Alert At</th>
                      <th className="text-right px-4 py-3">Cost/Unit</th>
                      <th className="text-left px-4 py-3">Supplier</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map(ing => (
                      <tr key={ing.id} className="table-row-hover border-t border-brew-50">
                        <td className="px-4 py-3 font-medium text-espresso-800">{ing.name}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {Number(ing.stock_qty).toFixed(1)} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-espresso-500 font-mono">
                          {ing.low_stock_alert} {ing.unit}
                        </td>
                        <td className="px-4 py-3 text-right text-espresso-500">
                          {fmt(ing.cost_per_unit)}/{ing.unit}
                        </td>
                        <td className="px-4 py-3 text-espresso-500 text-xs">
                          {ing.supplier_name || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={clsx('badge',
                            ing.is_low_stock
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          )}>
                            {ing.is_low_stock ? '⚠️ Low' : '✅ OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedIng(ing)}
                            className="text-xs text-brew-600 hover:text-brew-800 font-medium"
                          >
                            Adjust ›
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Stock movements tab ── */}
            {tab === 'movements' && (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-3">Date</th>
                      <th className="text-left px-4 py-3">Ingredient</th>
                      <th className="text-left px-4 py-3">Type</th>
                      <th className="text-right px-4 py-3">Qty Change</th>
                      <th className="text-left px-4 py-3">Notes</th>
                      <th className="text-left px-4 py-3">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id} className="table-row-hover border-t border-brew-50">
                        <td className="px-4 py-2.5 text-espresso-500 text-xs">
                          {new Date(m.created_at).toLocaleDateString('en-PH')}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-espresso-800">
                          {m.ingredient_name}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={clsx('badge capitalize',
                            m.movement_type === 'purchase'       ? 'bg-blue-100 text-blue-700'  :
                            m.movement_type === 'wastage'        ? 'bg-red-100 text-red-700'    :
                            m.movement_type === 'sale_deduction' ? 'bg-brew-100 text-brew-700'  :
                            'bg-gray-100 text-gray-700'
                          )}>
                            {m.movement_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={clsx('px-4 py-2.5 text-right font-mono font-semibold',
                          m.quantity_change >= 0 ? 'text-green-600' : 'text-red-500'
                        )}>
                          {m.quantity_change >= 0 ? '+' : ''}{Number(m.quantity_change).toFixed(1)} {m.unit}
                        </td>
                        <td className="px-4 py-2.5 text-espresso-500 text-xs">{m.notes || '—'}</td>
                        <td className="px-4 py-2.5 text-espresso-500 text-xs">{m.recorded_by_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {movements.length === 0 && (
                  <p className="text-center py-8 text-espresso-400 text-sm">No movements recorded yet</p>
                )}
              </div>
            )}

            {/* ── Suppliers tab ── */}
            {tab === 'suppliers' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map(s => (
                  <div key={s.id} className="card p-4">
                    <h3 className="font-semibold text-espresso-900">{s.name}</h3>
                    {s.contact && <p className="text-sm text-espresso-500 mt-1">👤 {s.contact}</p>}
                    {s.phone   && <p className="text-sm text-espresso-500">📞 {s.phone}</p>}
                    {s.email   && <p className="text-sm text-espresso-500">✉️ {s.email}</p>}
                    {s.address && <p className="text-sm text-espresso-400 mt-2 text-xs">{s.address}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stock adjustment modal */}
      {selectedIng && (
        <StockModal
          ingredient={selectedIng}
          onClose={() => setSelectedIng(null)}
          onSaved={loadData}
        />
      )}

      {showAddIng && (
        <AddIngredientModal
          suppliers={suppliers}
          onClose={() => setShowAddIng(false)}
          onSaved={loadData}
        />
      )}
    </AppShell>
  );
}

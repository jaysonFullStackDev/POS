'use client';
// app/inventory/products/page.tsx
// Full product catalog management (admin/manager only)

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { Product, Category, Ingredient } from '@/types';
import clsx from 'clsx';

const fmt = (n: number) =>
  '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 });

const CATEGORY_COLORS = [
  '#6F4E37', '#4A90D9', '#E8A87C', '#D4A373', '#9B8B7A',
  '#4CAF50', '#FF6B6B', '#A855F7', '#F59E0B', '#06B6D4',
];

// ── Category Modal ────────────────────────────────────────
function CategoryModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    try {
      await api.categories.create({ name, color });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-espresso-900 mb-4">New Category</h3>
        {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Category Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="input" placeholder="e.g. Smoothies" />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Color</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={clsx('w-8 h-8 rounded-full border-2 transition-all',
                    color === c ? 'border-espresso-900 scale-110' : 'border-transparent')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────
function ProductModal({
  product,
  categories,
  ingredients,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  ingredients: Ingredient[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name:        product?.name        || '',
    description: product?.description || '',
    price:       product?.price       ? String(product.price) : '',
    category_id: product?.category_id || (categories[0]?.id ?? ''),
    is_available: product?.is_available ?? true,
  });
  // Recipe: list of { ingredient_id, quantity }
  const [recipe, setRecipe] = useState<{ ingredient_id: string; quantity: string }[]>(
    product?.recipe?.map(r => ({
      ingredient_id: r.ingredient_id,
      quantity: String(r.quantity),
    })) || []
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addRecipeRow = () =>
    setRecipe(r => [...r, { ingredient_id: ingredients[0]?.id ?? '', quantity: '' }]);

  const removeRecipeRow = (i: number) =>
    setRecipe(r => r.filter((_, idx) => idx !== i));

  const updateRecipeRow = (i: number, key: 'ingredient_id' | 'quantity', val: string) =>
    setRecipe(r => r.map((row, idx) => idx === i ? { ...row, [key]: val } : row));

  const handleSave = async () => {
    if (!form.name || !form.price) {
      setError('Name and price are required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        recipe: recipe
          .filter(r => r.ingredient_id && r.quantity)
          .map(r => ({ ingredient_id: r.ingredient_id, quantity: parseFloat(r.quantity) })),
      };

      if (isEdit) {
        await api.products.update(product!.id, payload);
      } else {
        await api.products.create(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8">
        {/* Header */}
        <div className="p-6 border-b border-brew-100">
          <h3 className="font-display font-bold text-espresso-900 text-lg">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-espresso-600 block mb-1">Product Name *</label>
              <input type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" placeholder="e.g. Caramel Latte" />
            </div>

            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Price (₱) *</label>
              <input type="number" min="0" step="0.01" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                className="input" placeholder="0.00" />
            </div>

            <div>
              <label className="text-xs font-medium text-espresso-600 block mb-1">Category</label>
              <select value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="input">
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-espresso-600 block mb-1">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input resize-none" rows={2}
                placeholder="Short description…" />
            </div>

            {isEdit && (
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox"
                  id="is_available"
                  checked={form.is_available}
                  onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))}
                  className="w-4 h-4 accent-brew-600"
                />
                <label htmlFor="is_available" className="text-sm text-espresso-700">
                  Available for sale
                </label>
              </div>
            )}
          </div>

          {/* Recipe section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-espresso-600 uppercase tracking-wide">
                Recipe / Ingredients
              </label>
              <button type="button" onClick={addRecipeRow}
                className="text-xs text-brew-600 hover:text-brew-800 font-semibold">
                + Add Row
              </button>
            </div>

            {recipe.length === 0 ? (
              <p className="text-xs text-espresso-400 italic py-2">
                No recipe defined — stock won't be auto-deducted on sale.
              </p>
            ) : (
              <div className="space-y-2">
                {recipe.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select value={row.ingredient_id}
                      onChange={e => updateRecipeRow(i, 'ingredient_id', e.target.value)}
                      className="input flex-1 text-xs py-1.5">
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                    <input type="number" min="0" step="0.001"
                      value={row.quantity}
                      onChange={e => updateRecipeRow(i, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="input w-24 text-xs py-1.5"
                    />
                    <button onClick={() => removeRecipeRow(i)}
                      className="text-red-300 hover:text-red-500 text-xl leading-none">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={busy} className="btn-primary flex-1">
            {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function ProductsPage() {
  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editing,     setEditing]     = useState<Product | null | 'new'>('new' as any);
  const [showModal,   setShowModal]   = useState(false);
  const [filterCat,   setFilterCat]   = useState('all');
  const [showCatModal, setShowCatModal] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.products.list(),
      api.categories.list(),
      api.inventory.ingredients.list(),
    ])
      .then(([prods, cats, ings]) => {
        setProducts(prods);
        setCategories(cats);
        setIngredients(ings);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openNew  = () => { setEditing(null); setShowModal(true); };
  const openEdit = async (p: Product) => {
    try {
      const full = await api.products.get(p.id);
      setEditing(full);
    } catch {
      setEditing(p);
    }
    setShowModal(true);
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await api.products.update(product.id, { ...product, is_available: !product.is_available });
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p)
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.products.delete(product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openPreview = async (product: Product) => {
    setPreviewId(product.id);
    setPreviewLoading(true);
    try {
      const data = await api.products.get(product.id);
      setPreviewData(data);
    } catch { setPreviewData(null); }
    finally { setPreviewLoading(false); }
  };

  const filtered = filterCat === 'all'
    ? products
    : products.filter(p => p.category_id === filterCat);

  return (
    <AppShell requiredRole="manager">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-espresso-900">
              Product Catalog
            </h1>
            <p className="text-espresso-500 text-sm mt-1">
              {products.length} products · {products.filter(p => p.is_available).length} available
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCatModal(true)} className="btn-secondary text-sm">
              + Add Category
            </button>
            <button onClick={openNew} className="btn-primary text-sm">
              + Add Product
            </button>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterCat('all')}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
              filterCat === 'all' ? 'bg-brew-600 text-white' : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
            )}
          >
            All ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category_id === cat.id).length;
            return (
              <button key={cat.id}
                onClick={() => setFilterCat(cat.id)}
                className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                  filterCat === cat.id ? 'text-white' : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                )}
                style={filterCat === cat.id ? { backgroundColor: cat.color } : undefined}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product table */}
        {loading ? (
          <div className="card p-10 text-center animate-pulse text-espresso-400">Loading…</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-brew-50 text-espresso-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => (
                  <tr key={product.id} className="table-row-hover border-t border-brew-50 cursor-pointer"
                    onClick={() => openPreview(product)}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-espresso-800">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-espresso-400 mt-0.5 truncate max-w-xs">
                          {product.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge"
                        style={{
                          backgroundColor: (product.category_color || '#c97f3a') + '20',
                          color: product.category_color || '#c97f3a',
                        }}>
                        {product.category_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-espresso-900">
                      {fmt(product.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleAvailability(product); }}
                        className={clsx('badge cursor-pointer hover:opacity-80 transition-opacity',
                          product.is_available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        )}
                      >
                        {product.is_available ? '✅ Available' : '❌ Hidden'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(product); }}
                          className="text-xs text-brew-600 hover:text-brew-800 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          className="text-xs text-red-400 hover:text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-espresso-400">
                <p className="text-3xl mb-2">📭</p>
                <p>No products in this category</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Preview Card */}
      {previewId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setPreviewId(null); setPreviewData(null); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {previewLoading ? (
              <div className="p-10 text-center text-espresso-400 animate-pulse">Loading…</div>
            ) : previewData ? (
              <>
                <div className="p-6 border-b border-brew-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-espresso-900 text-xl">{previewData.name}</h3>
                      {previewData.description && (
                        <p className="text-sm text-espresso-500 mt-1">{previewData.description}</p>
                      )}
                    </div>
                    <button onClick={() => { setPreviewId(null); setPreviewData(null); }}
                      className="text-espresso-400 hover:text-espresso-700 text-xl">✕</button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-brew-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-espresso-500">Price</p>
                      <p className="font-bold text-espresso-900 text-lg">{fmt(previewData.price)}</p>
                    </div>
                    <div className="bg-brew-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-espresso-500">Category</p>
                      <span className="badge mt-1 text-xs" style={{
                        backgroundColor: (previewData.category_color || '#c97f3a') + '20',
                        color: previewData.category_color || '#c97f3a',
                      }}>{previewData.category_name || '—'}</span>
                    </div>
                    <div className="bg-brew-50 rounded-2xl p-3 text-center">
                      <p className="text-xs text-espresso-500">Status</p>
                      <span className={clsx('badge mt-1 text-xs',
                        previewData.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      )}>{previewData.is_available ? '✅ Available' : '❌ Hidden'}</span>
                    </div>
                  </div>

                  {/* Recipe / Ingredients */}
                  <div>
                    <h4 className="text-xs font-medium text-espresso-600 uppercase tracking-wide mb-2">
                      Recipe / Ingredients
                    </h4>
                    {previewData.recipe && previewData.recipe.length > 0 ? (
                      <div className="space-y-1.5">
                        {previewData.recipe.map((r: any) => (
                          <div key={r.ingredient_id} className="flex items-center justify-between bg-cream-50 rounded-xl px-3 py-2">
                            <span className="text-sm text-espresso-800">{r.ingredient_name}</span>
                            <span className="text-sm font-mono text-espresso-600">
                              {Number(r.quantity).toFixed(1)} {r.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-espresso-400 italic">No recipe defined</p>
                    )}
                  </div>
                </div>
                <div className="p-6 pt-0 flex gap-3">
                  <button onClick={() => { setPreviewId(null); setPreviewData(null); openEdit(previewData); }}
                    className="btn-primary flex-1 text-sm">Edit Product</button>
                  <button onClick={() => { setPreviewId(null); setPreviewData(null); }}
                    className="btn-secondary flex-1 text-sm">Close</button>
                </div>
              </>
            ) : (
              <div className="p-10 text-center text-red-500">Failed to load product</div>
            )}
          </div>
        </div>
      )}

      {showCatModal && (
        <CategoryModal
          onClose={() => setShowCatModal(false)}
          onSaved={loadData}
        />
      )}

      {showModal && (
        <ProductModal
          product={editing && editing !== 'new' ? (editing as Product) : null}
          categories={categories}
          ingredients={ingredients}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={loadData}
        />
      )}
    </AppShell>
  );
}

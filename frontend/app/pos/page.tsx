'use client';
// app/pos/page.tsx
// Main Point-of-Sale screen

import { useState, useEffect, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useCart } from '@/store/CartContext';
import { useAuth } from '@/store/AuthContext';
import type { Product, Category, Sale, PaymentMethod } from '@/types';
import clsx from 'clsx';

const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

// ── Product grid card ─────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      disabled={!product.is_available}
      className={clsx(
        'text-left p-3 rounded-2xl border-2 transition-all duration-150 group',
        product.is_available
          ? 'border-brew-100 hover:border-brew-400 hover:shadow-md bg-white'
          : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
      )}
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
        {product.category_name?.includes('Pastry') || product.category_name?.includes('Muffin')
          ? '🥐' : product.category_name?.includes('Cold') ? '🧊'
          : product.category_name?.includes('Non') ? '🍵' : '☕'}
      </div>
      <p className="font-semibold text-espresso-800 text-sm leading-tight line-clamp-2">
        {product.name}
      </p>
      <p className="text-brew-600 font-bold text-sm mt-1">{fmt(product.price)}</p>
      {!product.is_available && (
        <span className="text-xs text-red-400">Unavailable</span>
      )}
    </button>
  );
}

// ── Cart item row ─────────────────────────────────────────
function CartRow({ item, onQty, onRemove }: {
  item: { product: Product; quantity: number };
  onQty: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-brew-50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-espresso-800 truncate">{item.product.name}</p>
        <p className="text-xs text-brew-500">{fmt(item.product.price)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onQty(item.quantity - 1)}
          className="w-6 h-6 rounded-lg bg-brew-100 hover:bg-brew-200 text-brew-700
                     text-sm font-bold flex items-center justify-center transition-colors">
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-espresso-900">
          {item.quantity}
        </span>
        <button onClick={() => onQty(item.quantity + 1)}
          className="w-6 h-6 rounded-lg bg-brew-100 hover:bg-brew-200 text-brew-700
                     text-sm font-bold flex items-center justify-center transition-colors">
          +
        </button>
      </div>
      <div className="w-20 text-right">
        <p className="text-sm font-bold text-espresso-900">
          {fmt(item.product.price * item.quantity)}
        </p>
      </div>
      <button onClick={onRemove}
        className="text-red-300 hover:text-red-500 transition-colors ml-1 text-lg">
        ×
      </button>
    </div>
  );
}

// ── Receipt modal ─────────────────────────────────────────
function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 print-area">
        <div className="text-center mb-4">
          <span className="text-3xl">☕</span>
          <h2 className="font-display font-bold text-espresso-900 text-xl">BrewPOS</h2>
          <p className="text-espresso-500 text-xs">Coffee Shop</p>
        </div>

        <div className="border-t border-dashed border-brew-200 py-3 space-y-1">
          <div className="flex justify-between text-xs text-espresso-500">
            <span>Receipt #</span><span className="font-mono">{sale.sale_number}</span>
          </div>
          <div className="flex justify-between text-xs text-espresso-500">
            <span>Date</span>
            <span>{new Date(sale.created_at).toLocaleString('en-PH')}</span>
          </div>
          <div className="flex justify-between text-xs text-espresso-500">
            <span>Cashier</span><span>{sale.cashier_name}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-brew-200 py-3 space-y-2">
          {sale.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-espresso-700">
                {item.product_name} × {item.quantity}
              </span>
              <span className="font-medium">{fmt(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-brew-200 pt-3 space-y-1">
          <div className="flex justify-between text-sm text-espresso-600">
            <span>Subtotal</span><span>{fmt(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span><span>-{fmt(sale.discount)}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-sm text-espresso-600">
              <span>VAT (12%)</span><span>{fmt(sale.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-espresso-900 pt-1">
            <span>TOTAL</span><span>{fmt(sale.total_amount)}</span>
          </div>
          {sale.payment_method === 'cash' && (
            <>
              <div className="flex justify-between text-sm text-espresso-600">
                <span>Cash</span><span>{fmt(sale.amount_tendered || 0)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-green-600">
                <span>Change</span><span>{fmt(sale.change_due)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-sm text-espresso-500 capitalize">
            <span>Payment</span><span>{sale.payment_method}</span>
          </div>
        </div>

        <div className="text-center mt-4 text-xs text-espresso-400">
          Thank you for your visit! ☕
        </div>

        <div className="flex gap-3 mt-6 no-print">
          <button onClick={() => window.print()}
            className="btn-secondary flex-1 text-sm">
            🖨️ Print
          </button>
          <button onClick={onClose} className="btn-primary flex-1 text-sm">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main POS page ─────────────────────────────────────────
export default function POSPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search,     setSearch]     = useState('');
  const [processing, setProcessing] = useState(false);
  const [receipt,    setReceipt]    = useState<Sale | null>(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [notes,      setNotes]      = useState('');

  const { user } = useAuth();
  const {
    items, subtotal, taxAmount, total, discount,
    paymentMethod, setPaymentMethod, setDiscount,
    addItem, removeItem, updateQty, clearCart, itemCount
  } = useCart();

  useEffect(() => {
    Promise.all([api.products.list(), api.categories.list()])
      .then(([prods, cats]) => { setProducts(prods); setCategories(cats); })
      .catch(console.error);
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category_id === activeCategory;
    const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleCheckout = async () => {
    if (!items.length) return;
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (isNaN(tendered) || tendered < total) {
        alert('Amount tendered must be ≥ total');
        return;
      }
    }
    setProcessing(true);
    try {
      const sale = await api.sales.process({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        amount_tendered: parseFloat(amountTendered) || null,
        discount,
        notes,
      });
      // Attach items for receipt display
      sale.items = items.map(i => ({
        product_name: i.product.name,
        quantity: i.quantity,
        subtotal: i.product.price * i.quantity,
      }));
      sale.cashier_name = user?.name;
      setReceipt(sale);
      clearCart();
      setAmountTendered('');
      setNotes('');
    } catch (err: any) {
      alert('Sale failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const change = paymentMethod === 'cash'
    ? Math.max(0, parseFloat(amountTendered || '0') - total)
    : 0;

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">
        {/* ── Left: Product grid ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + filter bar */}
          <div className="p-4 bg-white border-b border-brew-100 space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input"
            />
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={clsx('px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                  activeCategory === 'all'
                    ? 'bg-brew-600 text-white'
                    : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                )}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx('px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                    activeCategory === cat.id
                      ? 'text-white'
                      : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                  )}
                  style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => addItem(product)}
                />
              ))}
            </div>
            {filteredProducts.length === 0 && (
              <div className="text-center py-16 text-espresso-400">
                <p className="text-4xl mb-2">🔍</p>
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart & checkout ── */}
        <div className="w-80 flex flex-col bg-white border-l border-brew-100">
          {/* Cart header */}
          <div className="p-4 border-b border-brew-100 flex items-center justify-between">
            <h2 className="font-display font-bold text-espresso-900">
              Cart {itemCount > 0 && <span className="text-brew-500">({itemCount})</span>}
            </h2>
            {items.length > 0 && (
              <button onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-600 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-espresso-300">
                <span className="text-5xl">🛒</span>
                <p className="mt-3 text-sm">Cart is empty</p>
                <p className="text-xs mt-1">Tap a product to add</p>
              </div>
            ) : (
              <div>
                {items.map(item => (
                  <CartRow
                    key={item.product.id}
                    item={item}
                    onQty={qty => updateQty(item.product.id, qty)}
                    onRemove={() => removeItem(item.product.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Checkout panel */}
          {items.length > 0 && (
            <div className="border-t border-brew-100 p-4 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <label className="text-xs text-espresso-500 w-16 shrink-0">Discount</label>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="input py-1.5 text-sm"
                  placeholder="₱0.00"
                />
              </div>

              {/* Payment method */}
              <div>
                <label className="text-xs text-espresso-500 mb-1.5 block">Payment</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'card', 'ewallet'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={clsx('py-2 rounded-xl text-xs font-semibold capitalize transition-colors',
                        paymentMethod === m
                          ? 'bg-brew-600 text-white'
                          : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                      )}
                    >
                      {m === 'cash' ? '💵' : m === 'card' ? '💳' : '📱'} {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash tendered */}
              {paymentMethod === 'cash' && (
                <div>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={e => setAmountTendered(e.target.value)}
                    className="input text-sm"
                    placeholder="Cash tendered…"
                  />
                  {parseFloat(amountTendered) >= total && (
                    <p className="text-xs text-green-600 mt-1 font-semibold">
                      Change: {fmt(change)}
                    </p>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-sm text-espresso-600">
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span><span>-{fmt(discount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-sm text-espresso-500">
                    <span>VAT (12%)</span><span>{fmt(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-espresso-900 pt-1 border-t border-brew-100">
                  <span>Total</span><span className="text-brew-700">{fmt(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="btn-primary w-full py-3 text-base"
              >
                {processing ? 'Processing…' : `Charge ${fmt(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />
      )}
    </AppShell>
  );
}

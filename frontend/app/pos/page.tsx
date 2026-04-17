'use client';
// app/pos/page.tsx
// Main Point-of-Sale screen — mobile responsive

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import { useCart } from '@/store/CartContext';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PAYMENT_METHODS } from '@/lib/payments';
import type { Product, Category, Sale, PaymentMethod, OrderType } from '@/types';
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
          ? 'border-brew-100 hover:border-brew-400 hover:shadow-md bg-white active:scale-95'
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
          className="w-7 h-7 rounded-lg bg-brew-100 hover:bg-brew-200 text-brew-700
                     text-sm font-bold flex items-center justify-center transition-colors">
          −
        </button>
        <span className="w-8 text-center text-sm font-bold text-espresso-900">
          {item.quantity}
        </span>
        <button onClick={() => onQty(item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-brew-100 hover:bg-brew-200 text-brew-700
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
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col print-area">
        <div className="overflow-y-auto p-6 flex-1">
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
            <div className="flex justify-between text-sm text-espresso-500 capitalize">
              <span>Order Type</span><span>{sale.order_type === 'take_out' ? '🥡 Take Out' : '🍽️ Dine In'}</span>
            </div>
          </div>
          <div className="text-center mt-4 text-xs text-espresso-400">
            Thank you for your visit! ☕
          </div>
        </div>
        <div className="p-6 pt-0 flex gap-3 no-print border-t border-brew-100">
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

// ── Cart Panel (used in both mobile overlay and desktop sidebar) ──
function CartPanel({ onClose, showClose }: { onClose?: () => void; showClose?: boolean }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    items, subtotal, taxAmount, total, discount,
    paymentMethod, setPaymentMethod, orderType, setOrderType, setDiscount,
    removeItem, updateQty, clearCart, itemCount
  } = useCart();

  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt]       = useState<Sale | null>(null);
  const [amountTendered, setAmountTendered] = useState('');
  const [notes, setNotes] = useState('');

  const change = paymentMethod === 'cash'
    ? Math.max(0, parseFloat(amountTendered || '0') - total)
    : 0;

  const handleCheckout = async () => {
    if (!items.length) return;
    if (paymentMethod === 'cash') {
      const tendered = parseFloat(amountTendered);
      if (isNaN(tendered) || tendered < total) {
        showToast(
          paymentMethod === 'cash' && !amountTendered
            ? 'Please enter the cash amount tendered.'
            : `Amount tendered (${fmt(tendered || 0)}) must be at least ${fmt(total)}.`,
          'error'
        );
        return;
      }
    }
    setProcessing(true);
    try {
      const sale = await api.sales.process({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        payment_method: paymentMethod,
        order_type: orderType,
        amount_tendered: parseFloat(amountTendered) || null,
        discount,
        notes,
      });
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
      showToast(err.isDemo ? err.message : 'Sale failed: ' + err.message, err.isDemo ? 'demo' : 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (receipt) {
    return <ReceiptModal sale={receipt} onClose={() => { setReceipt(null); onClose?.(); }} />;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Cart header */}
      <div className="p-4 border-b border-brew-100 flex items-center justify-between">
        <h2 className="font-display font-bold text-espresso-900">
          Cart {itemCount > 0 && <span className="text-brew-500">({itemCount})</span>}
        </h2>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button onClick={clearCart}
              className="text-xs text-red-400 hover:text-red-600 transition-colors">
              Clear all
            </button>
          )}
          {showClose && (
            <button onClick={onClose} className="text-espresso-400 hover:text-espresso-700 text-xl">✕</button>
          )}
        </div>
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 min-h-0">
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
          {/* Order type */}
          <div>
            <label className="text-xs text-espresso-500 mb-1.5 block">Order Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {([{ key: 'dine_in', label: 'Dine In', icon: '🍽️' }, { key: 'take_out', label: 'Take Out', icon: '🥡' }] as { key: OrderType; label: string; icon: string }[]).map(t => (
                <button key={t.key} onClick={() => setOrderType(t.key)}
                  className={clsx('py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1',
                    orderType === t.key
                      ? 'bg-brew-600 text-white'
                      : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                  )}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-espresso-500 w-16 shrink-0">Discount</label>
            <input type="number" min="0" value={discount || ''}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="input py-1.5 text-sm" placeholder="₱0.00" />
          </div>

          <div>
            <label className="text-xs text-espresso-500 mb-1.5 block">Payment</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PAYMENT_METHODS.map(m => (
                <button key={m.key} onClick={() => setPaymentMethod(m.key)}
                  className={clsx('py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1',
                    paymentMethod === m.key
                      ? 'bg-brew-600 text-white'
                      : `${m.bg} ${m.color} hover:opacity-80`
                  )}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <input type="number" value={amountTendered}
                onChange={e => setAmountTendered(e.target.value)}
                className="input text-sm" placeholder="Cash tendered…" />
              {parseFloat(amountTendered) >= total && (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  Change: {fmt(change)}
                </p>
              )}
            </div>
          )}

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

          <button onClick={handleCheckout} disabled={processing}
            className="btn-primary w-full py-3 text-base">
            {processing ? 'Processing…' : `Charge ${fmt(total)}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main POS page ─────────────────────────────────────────
export default function POSPage() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search,     setSearch]     = useState('');
  const [cartOpen,   setCartOpen]   = useState(false);

  const { itemCount, total, addItem } = useCart();

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

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)] lg:h-screen overflow-hidden relative">
        {/* ── Left: Product grid ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + filter bar */}
          <div className="p-3 sm:p-4 bg-white border-b border-brew-100 space-y-2 sm:space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="input"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={clsx('px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                  activeCategory === 'all'
                    ? 'bg-brew-600 text-white'
                    : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                )}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={clsx('px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors',
                    activeCategory === cat.id
                      ? 'text-white'
                      : 'bg-brew-50 text-brew-700 hover:bg-brew-100'
                  )}
                  style={activeCategory === cat.id ? { backgroundColor: cat.color } : undefined}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 lg:pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
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

        {/* ── Desktop: Cart sidebar ── */}
        <div className="hidden lg:flex w-80 flex-col bg-white border-l border-brew-100 h-full overflow-hidden">
          <CartPanel />
        </div>

        {/* ── Mobile: Floating cart button ── */}
        {itemCount > 0 && (
          <button
            onClick={() => setCartOpen(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 bg-brew-600 text-white
                       rounded-2xl shadow-lg px-5 py-3 flex items-center gap-3
                       active:scale-95 transition-transform">
            <span className="text-xl">🛒</span>
            <div className="text-left">
              <p className="text-xs font-medium opacity-80">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
              <p className="text-sm font-bold">{fmt(total)}</p>
            </div>
          </button>
        )}

        {/* ── Mobile: Cart slide-up panel ── */}
        {cartOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
              <div className="w-12 h-1.5 bg-brew-200 rounded-full mx-auto mt-3 mb-1" />
              <CartPanel onClose={() => setCartOpen(false)} showClose />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

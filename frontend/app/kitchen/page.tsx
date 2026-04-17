'use client';
// app/kitchen/page.tsx
// Kitchen Display System — real-time order queue

import { useState, useEffect, useCallback, useRef } from 'react';
import AppShell from '@/components/layout/AppShell';
import { api } from '@/lib/api';
import type { KitchenOrder, OrderStatus } from '@/types';
import clsx from 'clsx';

const COLUMNS: { status: OrderStatus; label: string; icon: string; color: string }[] = [
  { status: 'pending',   label: 'New Orders',  icon: '🔔', color: 'border-amber-400 bg-amber-50' },
  { status: 'preparing', label: 'Preparing',   icon: '👨‍🍳', color: 'border-blue-400 bg-blue-50' },
  { status: 'ready',     label: 'Ready',       icon: '✅', color: 'border-green-400 bg-green-50' },
];

const NEXT_STATUS: Record<string, OrderStatus> = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'completed',
};

const ACTION_LABEL: Record<string, string> = {
  pending:   'Start Preparing',
  preparing: 'Mark Ready',
  ready:     'Complete',
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function OrderCard({ order, onAdvance }: { order: KitchenOrder; onAdvance: () => void }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    await onAdvance();
    setBusy(false);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-brew-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono font-bold text-espresso-900 text-sm">
          {order.sale_number}
        </span>
        <div className="flex items-center gap-2">
          <span className={clsx('badge text-xs',
            order.order_type === 'take_out' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          )}>
            {order.order_type === 'take_out' ? '🥡 Take Out' : '🍽️ Dine In'}
          </span>
          <span className="text-xs text-espresso-400">{timeAgo(order.created_at)}</span>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-espresso-700">{item.product_name}</span>
            <span className="font-bold text-espresso-900">×{item.quantity}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mb-3">
          📝 {order.notes}
        </p>
      )}

      {order.cashier_name && (
        <p className="text-xs text-espresso-400 mb-3">Cashier: {order.cashier_name}</p>
      )}

      <button
        onClick={handleClick}
        disabled={busy}
        className={clsx(
          'w-full py-2 rounded-xl text-sm font-semibold transition-colors',
          order.order_status === 'pending'   && 'bg-blue-500 hover:bg-blue-600 text-white',
          order.order_status === 'preparing' && 'bg-green-500 hover:bg-green-600 text-white',
          order.order_status === 'ready'     && 'bg-espresso-700 hover:bg-espresso-800 text-white',
          'disabled:opacity-50'
        )}
      >
        {busy ? '...' : ACTION_LABEL[order.order_status]}
      </button>
    </div>
  );
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<any>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.orders.active();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + Socket.IO for real-time updates
  useEffect(() => {
    fetchOrders();

    // Dynamic import socket.io-client to avoid SSR issues
    let socket: any;
    (async () => {
      try {
        const { io } = await import('socket.io-client');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        socket = io(API_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('order:new', () => fetchOrders());
        socket.on('order:update', () => fetchOrders());
      } catch {
        // Fallback: poll every 5s if socket.io-client not available
        const interval = setInterval(fetchOrders, 5000);
        socketRef.current = { fallbackInterval: interval };
      }
    })();

    return () => {
      if (socketRef.current?.disconnect) socketRef.current.disconnect();
      if (socketRef.current?.fallbackInterval) clearInterval(socketRef.current.fallbackInterval);
    };
  }, [fetchOrders]);

  const advanceOrder = async (orderId: string, currentStatus: OrderStatus) => {
    const next = NEXT_STATUS[currentStatus];
    if (!next) return;
    try {
      await api.orders.updateStatus(orderId, next);
      // If completed, remove from list; otherwise update status locally
      setOrders(prev =>
        next === 'completed'
          ? prev.filter(o => o.id !== orderId)
          : prev.map(o => o.id === orderId ? { ...o, order_status: next } : o)
      );
    } catch (err: any) {
      alert('Failed to update order: ' + err.message);
    }
  };

  const ordersByStatus = (status: OrderStatus) =>
    orders.filter(o => o.order_status === status);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <span className="text-4xl animate-pulse">👨‍🍳</span>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-3 sm:p-4 lg:p-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="font-display text-lg sm:text-2xl font-bold text-espresso-900">
              👨‍🍳 Kitchen Display
            </h1>
            <p className="text-xs sm:text-sm text-espresso-500">
              {orders.length} active order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={fetchOrders} className="btn-secondary text-sm">
            🔄 Refresh
          </button>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-hidden">
          {COLUMNS.map(col => {
            const colOrders = ordersByStatus(col.status);
            return (
              <div key={col.status} className="flex flex-col min-h-0">
                <div className={clsx(
                  'rounded-xl border-2 px-4 py-2 mb-3 flex items-center gap-2',
                  col.color
                )}>
                  <span className="text-lg">{col.icon}</span>
                  <span className="font-bold text-espresso-800">{col.label}</span>
                  <span className="ml-auto badge bg-white text-espresso-700 shadow-sm">
                    {colOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colOrders.length === 0 ? (
                    <div className="text-center py-12 text-espresso-300 text-sm">
                      No orders
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onAdvance={() => advanceOrder(order.id, order.order_status)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

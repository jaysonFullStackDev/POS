'use client';
// store/CartContext.tsx
// POS cart state — manages items, quantities, discount

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Product, CartItem, PaymentMethod, OrderType } from '@/types';

interface CartContextValue {
  items: CartItem[];
  discount: number;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setDiscount: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setOrderType: (type: OrderType) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

const TAX_RATE = 0.12; // 12% VAT — adjust or pull from env

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,         setItems]         = useState<CartItem[]>([]);
  const [discount,      setDiscount]      = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [orderType,     setOrderType]     = useState<OrderType>('dine_in');

  const addItem = useCallback((product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setItems(prev =>
        prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i)
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setPaymentMethod('cash');
    setOrderType('dine_in');
  }, []);

  // Derived totals
  const subtotal  = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const taxable   = Math.max(0, subtotal - discount);
  const taxAmount = parseFloat((taxable * TAX_RATE).toFixed(2));
  const total     = parseFloat((taxable + taxAmount).toFixed(2));
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, discount, paymentMethod, orderType,
      addItem, removeItem, updateQty, clearCart,
      setDiscount, setPaymentMethod, setOrderType,
      subtotal, taxAmount, total, itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

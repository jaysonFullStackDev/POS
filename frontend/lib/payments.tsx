// lib/payments.tsx
// Shared payment method config with brand-styled icons

import { Banknote, CreditCard, Smartphone, Building2, Landmark } from 'lucide-react';
import type { PaymentMethod } from '@/types';

interface PaymentInfo {
  key: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

export const PAYMENT_METHODS: PaymentInfo[] = [
  { key: 'cash',          label: 'Cash',          icon: <Banknote className="w-4 h-4" />,    color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  { key: 'card',          label: 'Card',          icon: <CreditCard className="w-4 h-4" />,  color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { key: 'gcash',         label: 'GCash',         icon: <Smartphone className="w-4 h-4" />,  color: 'text-[#007DFE]',  bg: 'bg-blue-50 border-blue-200' },
  { key: 'maya',          label: 'Maya',          icon: <Smartphone className="w-4 h-4" />,  color: 'text-[#00C853]',  bg: 'bg-green-50 border-green-200' },
  { key: 'gotyme',        label: 'GoTyme',        icon: <Building2 className="w-4 h-4" />,   color: 'text-[#6B21A8]',  bg: 'bg-purple-50 border-purple-200' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: <Landmark className="w-4 h-4" />,    color: 'text-[#1E3A5F]',  bg: 'bg-slate-50 border-slate-200' },
];

export function PaymentBadge({ method }: { method: string }) {
  const info = PAYMENT_METHODS.find(p => p.key === method);
  if (!info) return <span className="badge bg-gray-100 text-gray-700 capitalize">{method}</span>;
  return (
    <span className={`badge border ${info.bg} ${info.color} gap-1 capitalize`}>
      {info.icon} {info.label}
    </span>
  );
}

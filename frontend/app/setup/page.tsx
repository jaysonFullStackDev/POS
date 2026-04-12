'use client';
// app/setup/page.tsx
// Tenant setup wizard — company info + payment config

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { api } from '@/lib/api';

const PAYMENT_PROVIDERS = [
  { key: 'gcash',         label: 'GCash',         icon: '📱' },
  { key: 'maya',          label: 'Maya',           icon: '💳' },
  { key: 'gotyme',        label: 'GoTyme',         icon: '🏦' },
  { key: 'bank_transfer', label: 'Bank Transfer',  icon: '🏧' },
] as const;

type ProviderKey = typeof PAYMENT_PROVIDERS[number]['key'];

interface ProviderForm {
  enabled: boolean;
  account_name: string;
  account_number: string;
  bank_name: string;
}

export default function SetupPage() {
  const { user, needsSetup, markSetupDone } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — Company info
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 — Payment config
  const [payments, setPayments] = useState<Record<ProviderKey, ProviderForm>>({
    gcash:         { enabled: false, account_name: '', account_number: '', bank_name: '' },
    maya:          { enabled: false, account_name: '', account_number: '', bank_name: '' },
    gotyme:        { enabled: false, account_name: '', account_number: '', bank_name: '' },
    bank_transfer: { enabled: false, account_name: '', account_number: '', bank_name: '' },
  });

  const updatePayment = (key: ProviderKey, field: keyof ProviderForm, value: string | boolean) => {
    setPayments(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) { setError('Company name is required'); return; }
    setError('');
    setBusy(true);
    try {
      await api.auth.tenantSetup({
        company_name: companyName,
        address,
        phone,
        payment_config: payments,
      });
      markSetupDone();
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Setup failed');
    } finally {
      setBusy(false);
    }
  };

  // Redirect if not logged in or setup already done
  if (!user) return null;
  if (!needsSetup) { router.replace('/dashboard'); return null; }

  return (
    <div className="min-h-screen bg-gradient-to-br from-espresso-950 via-espresso-900 to-brew-900
                    flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <span className="text-4xl">☕</span>
          <h1 className="text-2xl font-display font-bold text-cream-100 mt-2">Set Up Your Shop</h1>
          <p className="text-brew-300 text-sm mt-1">Step {step} of 2</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-espresso-900">Company Information</h2>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1">Company Name *</label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="input" placeholder="My Coffee Shop" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1">Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  className="input" placeholder="123 Main St, City" />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  className="input" placeholder="+63-XXX-XXX-XXXX" />
              </div>
              <button onClick={() => { if (!companyName.trim()) { setError('Company name is required'); return; } setError(''); setStep(2); }}
                className="btn-primary w-full py-3 text-base mt-2">
                Next → Payment Setup
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-semibold text-espresso-900">Payment Methods</h2>
              <p className="text-sm text-espresso-500">Enable the payment methods your shop accepts. You can update these later.</p>

              {PAYMENT_PROVIDERS.map(({ key, label, icon }) => (
                <div key={key} className="border border-brew-200 rounded-2xl p-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={payments[key].enabled}
                      onChange={e => updatePayment(key, 'enabled', e.target.checked)}
                      className="w-4 h-4 rounded border-brew-300 text-brew-600 focus:ring-brew-500" />
                    <span className="text-lg">{icon}</span>
                    <span className="font-medium text-espresso-800">{label}</span>
                  </label>

                  {payments[key].enabled && (
                    <div className="mt-3 ml-7 space-y-2">
                      <input value={payments[key].account_name}
                        onChange={e => updatePayment(key, 'account_name', e.target.value)}
                        className="input text-sm" placeholder="Account Name" />
                      <input value={payments[key].account_number}
                        onChange={e => updatePayment(key, 'account_number', e.target.value)}
                        className="input text-sm" placeholder="Account / Mobile Number" />
                      {key === 'bank_transfer' && (
                        <input value={payments[key].bank_name}
                          onChange={e => updatePayment(key, 'bank_name', e.target.value)}
                          className="input text-sm" placeholder="Bank Name" />
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={handleSubmit} disabled={busy} className="btn-primary flex-1">
                  {busy ? 'Saving…' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

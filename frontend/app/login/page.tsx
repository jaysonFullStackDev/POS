'use client';
// app/login/page.tsx
// Login screen with Google OAuth + email/password

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { getSafeRedirect } from '@/lib/safeRedirect';
import Script from 'next/script';

declare global {
  interface Window { google?: any; }
}

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading, needsSetup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('returnTo'), '/dashboard');

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(needsSetup ? '/setup' : redirectTo);
    }
  }, [user, loading, needsSetup, router, redirectTo]);

  const handleGoogleResponse = useCallback(async (response: any) => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  }, [loginWithGoogle]);

  const initGoogle = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' }
      );
    }
  }, [handleGoogleResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (role: 'admin' | 'manager' | 'cashier') => {
    const creds = {
      admin:   { email: 'admin@brewpos.com',   password: 'Admin@123' },
      manager: { email: 'manager@brewpos.com', password: 'Manager@123' },
      cashier: { email: 'cashier@brewpos.com', password: 'Cashier@123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />
      <div className="min-h-screen bg-gradient-to-br from-espresso-950 via-espresso-900 to-brew-900
                      flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border-4 border-brew-700/20" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full border-4 border-brew-600/20" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full border-2 border-cream-400/10" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brew-500 rounded-2xl shadow-lg mb-4">
              <span className="text-3xl">☕</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-cream-100">BrewPOS</h1>
            <p className="text-brew-300 text-sm mt-1">Coffee Shop Management</p>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
            <h2 className="text-xl font-display font-semibold text-espresso-900 mb-6">
              Sign in to your account
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Google Sign-In — for new shop owners */}
            <div id="google-signin-btn" className="mb-4 flex justify-center" />

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brew-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-espresso-400">or sign in with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input" placeholder="you@brewpos.com" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso-700 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="input" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base mt-2">
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-brew-100">
              <p className="text-xs text-espresso-400 mb-3 text-center">Demo credentials</p>
              <div className="grid grid-cols-3 gap-2">
                {(['admin', 'manager', 'cashier'] as const).map(role => (
                  <button key={role} onClick={() => fillDemo(role)}
                    className="text-xs py-1.5 px-2 rounded-lg bg-brew-50 hover:bg-brew-100
                               text-brew-700 border border-brew-200 transition-colors capitalize">
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

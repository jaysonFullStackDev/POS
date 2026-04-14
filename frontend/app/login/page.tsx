'use client';
// app/login/page.tsx
// Sign in screen — email/password + Google

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { getSafeRedirect } from '@/lib/safeRedirect';
import Link from 'next/link';
import Script from 'next/script';

declare global {
  interface Window { google?: any; }
}

function LoginContent() {
  const { login, loginWithGoogle, user, loading, needsSetup } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getSafeRedirect(searchParams.get('returnTo'), '/dashboard');
  const isDemo = searchParams.get('demo') === 'true';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDemo && !user && !loading) {
      setEmail('admin@brewpos.com');
      setPassword('Admin@123');
    }
  }, [isDemo, user, loading]);

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

  // Render Google button on mount (works on client-side navigation too)
  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !googleBtnRef.current) return;
      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline', size: 'large', width: 320, text: 'signin_with',
      });
    };
    if (window.google) { render(); }
    else {
      const interval = setInterval(() => {
        if (window.google) { render(); clearInterval(interval); }
      }, 100);
      return () => { cancelled = true; clearInterval(interval); };
    }
    return () => { cancelled = true; };
  }, [handleGoogleResponse, isDemo]);

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

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div className="min-h-screen bg-gradient-to-br from-espresso-950 via-espresso-900 to-brew-900
                      flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full border-4 border-brew-700/20" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full border-4 border-brew-600/20" />
        </div>

        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brew-500 rounded-2xl shadow-lg mb-4">
                <span className="text-3xl">☕</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-cream-100">BrewPOS</h1>
            </Link>
            <p className="text-brew-300 text-sm mt-1">Coffee Shop Management</p>
          </div>

          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
            {isDemo ? (
              <>
                <h2 className="text-xl font-display font-semibold text-espresso-900 mb-2">
                  🔒 Demo Mode
                </h2>
                <p className="text-sm text-espresso-500 mb-6">
                  Choose a role to explore the app. Changes won't be saved.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                <div className="space-y-2">
                  {([
                    { role: 'admin', label: 'Admin', desc: 'Full access — manage everything', icon: '👑', email: 'admin@brewpos.com', pw: 'Admin@123' },
                    { role: 'manager', label: 'Manager', desc: 'POS, inventory, accounting', icon: '📋', email: 'manager@brewpos.com', pw: 'Manager@123' },
                    { role: 'cashier', label: 'Cashier', desc: 'POS and kitchen only', icon: '🛒', email: 'cashier@brewpos.com', pw: 'Cashier@123' },
                  ] as const).map(d => (
                    <button key={d.role}
                      disabled={busy}
                      onClick={async () => {
                        setError('');
                        setBusy(true);
                        try { await login(d.email, d.pw); }
                        catch (err: any) { setError(err.message || 'Login failed'); }
                        finally { setBusy(false); }
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-brew-100 hover:border-brew-400 hover:bg-brew-50 transition-all text-left active:scale-[0.98]">
                      <span className="text-2xl">{d.icon}</span>
                      <div>
                        <p className="font-semibold text-espresso-900 text-sm">{d.label}</p>
                        <p className="text-xs text-espresso-500">{d.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-display font-semibold text-espresso-900 mb-6">
                  Sign in to your account
                </h2>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
                )}

                {/* Google Sign-In */}
                <div ref={googleBtnRef} className="flex justify-center mb-4" />

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
                      className="input" placeholder="you@yourshop.com" required autoFocus />
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
              </>
            )}

            <div className="mt-6 pt-5 border-t border-brew-100 text-center space-y-2">
              {!isDemo && (
                <p className="text-sm text-espresso-500">
                  Don't have an account?{' '}
                  <Link href="/signup" className="text-brew-600 hover:text-brew-800 font-semibold">Sign up</Link>
                </p>
              )}
              <p className="text-sm text-espresso-500">
                {isDemo ? (
                  <Link href="/login" className="text-brew-600 hover:text-brew-800 font-semibold">← Back to Sign In</Link>
                ) : (
                  <Link href="/login?demo=true" className="text-brew-600 hover:text-brew-800 font-semibold">Try Demo →</Link>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-espresso-950 via-espresso-900 to-brew-900 flex items-center justify-center">
        <span className="text-4xl animate-pulse">☕</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

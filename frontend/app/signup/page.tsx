'use client';
// app/signup/page.tsx
// Create account — Google OAuth signup

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import Link from 'next/link';
import Script from 'next/script';

declare global {
  interface Window { google?: any; }
}

export default function SignupPage() {
  const { loginWithGoogle, user, loading, needsSetup } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy]   = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(needsSetup ? '/setup' : '/dashboard');
    }
  }, [user, loading, needsSetup, router]);

  const handleGoogleResponse = useCallback(async (response: any) => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed');
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
        document.getElementById('google-signup-btn'),
        { theme: 'outline', size: 'large', width: 320, text: 'signup_with' }
      );
    }
  }, [handleGoogleResponse]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" onLoad={initGoogle} />
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
            <h2 className="text-xl font-display font-semibold text-espresso-900 mb-2">
              Create your shop
            </h2>
            <p className="text-sm text-espresso-500 mb-6">
              Sign up with Google to get started in seconds. You'll set up your shop details next.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {/* Google Sign-Up button */}
            <div id="google-signup-btn" className="flex justify-center mb-6" />

            {busy && (
              <p className="text-center text-sm text-espresso-400 animate-pulse">Creating your account…</p>
            )}

            {/* What you get */}
            <div className="border-t border-brew-100 pt-5 mt-2">
              <p className="text-xs text-espresso-400 uppercase tracking-wide font-semibold mb-3">What you get</p>
              <ul className="space-y-2">
                {[
                  'Your own isolated shop environment',
                  'POS, inventory, kitchen display & reports',
                  'Create manager & cashier accounts',
                  'GCash, Maya, GoTyme & bank transfer support',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-espresso-600">
                    <span className="text-green-500">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-5 border-t border-brew-100 text-center space-y-2">
              <p className="text-sm text-espresso-500">
                Already have an account?{' '}
                <Link href="/login" className="text-brew-600 hover:text-brew-800 font-semibold">Sign in</Link>
              </p>
              <p className="text-sm text-espresso-500">
                <Link href="/login?demo=true" className="text-brew-600 hover:text-brew-800 font-semibold">Try Demo →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';
// components/layout/AppShell.tsx
// Wraps all authenticated pages with sidebar + auth guard

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { isAllowedRedirect } from '@/lib/safeRedirect';
import Sidebar from './Sidebar';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager'; // if set, cashier is redirected
}

export default function AppShell({ children, requiredRole }: Props) {
  const { user, loading, needsSetup } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const returnTo = isAllowedRedirect(pathname) ? `?returnTo=${pathname}` : '';
        router.replace(`/login${returnTo}`);
      } else if (needsSetup) {
        router.replace('/setup');
      } else if (requiredRole) {
        const allowed = requiredRole === 'manager'
          ? ['admin', 'manager'].includes(user.role)
          : user.role === 'admin';
        if (!allowed) router.replace('/dashboard');
      }
    }
  }, [user, loading, requiredRole, router, pathname, needsSetup]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brew-50">
        <div className="text-center">
          <span className="text-4xl animate-pulse">☕</span>
          <p className="text-brew-500 mt-2 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brew-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-espresso-950 text-cream-100">
          <button onClick={() => setSidebarOpen(true)} className="text-xl">
            ☰
          </button>
          <span className="font-display font-bold">☕ BrewPOS</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

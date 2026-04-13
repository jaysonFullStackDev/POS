'use client';
// app/page.tsx
// Landing page for BrewPOS

import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const FEATURES = [
  { icon: '🛒', title: 'Point of Sale', desc: 'Fast, intuitive cashier screen with real-time cart and multiple payment methods.' },
  { icon: '👨‍🍳', title: 'Kitchen Display', desc: 'Orders appear instantly via WebSocket. Track pending, preparing, and ready orders.' },
  { icon: '📦', title: 'Inventory', desc: 'Auto-deduct ingredients on every sale. Get alerts when stock runs low.' },
  { icon: '☕', title: 'Product Catalog', desc: 'Manage products with categories, recipes, and ingredient-level costing.' },
  { icon: '💰', title: 'Accounting', desc: 'Track expenses, view P&L reports, and monitor monthly cash flow.' },
  { icon: '📊', title: 'Reports', desc: 'Sales summaries, top products, inventory usage — all in real-time charts.' },
  { icon: '👥', title: 'Staff Management', desc: 'Role-based access for admin, manager, and cashier accounts.' },
  { icon: '🏢', title: 'Multi-Tenant', desc: 'Each shop is fully isolated. Sign up with Google to create your own.' },
];

const STEPS = [
  { num: '1', title: 'Sign Up', desc: 'Create your account with Google in one click.' },
  { num: '2', title: 'Set Up Shop', desc: 'Enter your company info and payment methods.' },
  { num: '3', title: 'Start Selling', desc: 'Add products, manage inventory, and process orders.' },
];

const ROLES = [
  { role: 'Admin', color: 'bg-red-100 text-red-700', perms: ['Everything', 'Staff management', 'Audit logs', 'Delete products'] },
  { role: 'Manager', color: 'bg-blue-100 text-blue-700', perms: ['POS & Kitchen', 'Inventory & Products', 'Accounting & Reports'] },
  { role: 'Cashier', color: 'bg-green-100 text-green-700', perms: ['Point of Sale', 'Kitchen Display', 'Sales History'] },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-espresso-950 via-espresso-900 to-brew-900">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☕</span>
          <span className="font-display font-bold text-cream-100 text-xl">BrewPOS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-brew-300 hover:text-cream-100 transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="bg-brew-500 hover:bg-brew-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-brew-800/50 border border-brew-700/50 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-brew-300">Free for small coffee shops</span>
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-cream-100 leading-tight">
          Run your coffee shop
          <br />
          <span className="text-brew-400">like a pro</span>
        </h1>
        <p className="mt-6 text-lg text-brew-300 max-w-2xl mx-auto leading-relaxed">
          A complete POS system with real-time orders, automatic inventory tracking,
          expense management, and profit reporting — built for small coffee shop owners.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login"
            className="bg-brew-500 hover:bg-brew-600 text-white font-bold px-8 py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-brew-500/25">
            ☕ Start Free
          </Link>
          <Link href="/login"
            className="bg-white/10 hover:bg-white/20 text-cream-100 font-bold px-8 py-4 rounded-2xl text-lg transition-colors border border-white/10">
            Try Demo →
          </Link>
        </div>
        <p className="mt-4 text-xs text-brew-500">No credit card required · Sign up with Google</p>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-cream-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-espresso-900">
              Everything you need to manage your shop
            </h2>
            <p className="mt-3 text-espresso-500 max-w-xl mx-auto">
              From taking orders to tracking profits — all in one place.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-5 border border-brew-100 hover:shadow-md hover:border-brew-300 transition-all">
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h3 className="font-display font-bold text-espresso-900 mb-1">{f.title}</h3>
                <p className="text-sm text-espresso-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-espresso-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-cream-100">
              Up and running in 3 steps
            </h2>
            <p className="mt-3 text-brew-400">Get started in under 5 minutes.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-14 h-14 bg-brew-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg shadow-brew-500/30">
                  {s.num}
                </div>
                <h3 className="font-display font-bold text-cream-100 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-brew-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 py-20 bg-cream-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-espresso-900">
              Role-based access control
            </h2>
            <p className="mt-3 text-espresso-500">Each role sees only what they need.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {ROLES.map(r => (
              <div key={r.role} className="bg-white rounded-2xl p-6 border border-brew-100">
                <span className={`badge text-sm mb-4 ${r.color}`}>{r.role}</span>
                <ul className="space-y-2">
                  {r.perms.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-espresso-700">
                      <span className="text-green-500">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment methods */}
      <section className="px-6 py-20 bg-espresso-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-cream-100 mb-4">
            Accept payments your way
          </h2>
          <p className="text-brew-400 mb-10">Support for the most popular Philippine payment methods.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['💵 Cash', '💳 Card', '📱 GCash', '📱 Maya', '🏦 GoTyme', '🏧 Bank Transfer'].map(m => (
              <div key={m} className="bg-white/10 border border-white/10 rounded-2xl px-6 py-3 text-cream-100 font-medium">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 bg-gradient-to-b from-brew-800 to-brew-900">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-5xl block mb-6">☕</span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-cream-100 mb-4">
            Ready to brew success?
          </h2>
          <p className="text-brew-300 mb-10 text-lg">
            Join coffee shop owners who manage their business smarter with BrewPOS.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login"
              className="bg-white text-espresso-900 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-cream-100 transition-colors shadow-lg">
              Get Started Free
            </Link>
            <Link href="/login"
              className="bg-white/10 hover:bg-white/20 text-cream-100 font-bold px-8 py-4 rounded-2xl text-lg transition-colors border border-white/20">
              Try Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-espresso-950 border-t border-espresso-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">☕</span>
            <span className="font-display font-bold text-cream-100">BrewPOS</span>
            <span className="text-xs text-espresso-500 ml-2">Built for small coffee shop owners</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-espresso-400">
            <Link href="/login" className="hover:text-cream-100 transition-colors">Sign In</Link>
            <a href="https://github.com/jaysonFullStackDev/POS" target="_blank" rel="noopener"
              className="hover:text-cream-100 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

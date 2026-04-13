'use client';
// app/page.tsx
// Landing page for BrewPOS — animated & mobile responsive

import Link from 'next/link';
import { useAuth } from '@/store/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';

// ── Scroll-triggered fade-in hook ─────────────────────────
function useInView(startVisible = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(startVisible);
  useEffect(() => {
    if (startVisible) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05, rootMargin: '50px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startVisible]);
  return { ref, visible };
}

// ── Animated counter ──────────────────────────────────────
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 30);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

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
  { num: '1', title: 'Sign Up', desc: 'Create your account with Google in one click.', icon: '🔐' },
  { num: '2', title: 'Set Up Shop', desc: 'Enter your company info and payment methods.', icon: '🏪' },
  { num: '3', title: 'Start Selling', desc: 'Add products, manage inventory, and process orders.', icon: '🚀' },
];

const ROLES = [
  { role: 'Admin', color: 'bg-red-100 text-red-700', border: 'hover:border-red-300', perms: ['Everything', 'Staff management', 'Audit logs', 'Delete products'] },
  { role: 'Manager', color: 'bg-blue-100 text-blue-700', border: 'hover:border-blue-300', perms: ['POS & Kitchen', 'Inventory & Products', 'Accounting & Reports'] },
  { role: 'Cashier', color: 'bg-green-100 text-green-700', border: 'hover:border-green-300', perms: ['Point of Sale', 'Kitchen Display', 'Sales History'] },
];

const PAYMENTS = [
  { icon: '💵', label: 'Cash' },
  { icon: '💳', label: 'Card' },
  { icon: '📱', label: 'GCash' },
  { icon: '📱', label: 'Maya' },
  { icon: '🏦', label: 'GoTyme' },
  { icon: '🏧', label: 'Bank Transfer' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hero = useInView(true);
  const stats = useInView(true);
  const features = useInView();
  const steps = useInView();
  const roles = useInView();
  const payments = useInView();
  const cta = useInView();

  if (loading) return (
    <div className="min-h-screen bg-espresso-950 flex items-center justify-center">
      <span className="text-4xl animate-pulse">☕</span>
    </div>
  );
  if (user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-espresso-950 via-espresso-900 to-brew-900">

      {/* ── Floating decorative elements ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brew-500/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 -left-32 w-72 h-72 bg-brew-600/5 rounded-full blur-3xl animate-float-slower" />
      </div>

      {/* ── Nav ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-espresso-950/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">☕</span>
            <span className="font-display font-bold text-cream-100 text-lg sm:text-xl">BrewPOS</span>
          </div>
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login" className="text-sm text-brew-300 hover:text-cream-100 transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="bg-brew-500 hover:bg-brew-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-brew-500/25 active:scale-95">
              Get Started
            </Link>
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenu(!mobileMenu)} className="sm:hidden text-cream-100 text-2xl">
            {mobileMenu ? '✕' : '☰'}
          </button>
        </div>
        {/* Mobile menu */}
        {mobileMenu && (
          <div className="sm:hidden bg-espresso-950/95 backdrop-blur-lg border-t border-espresso-800 px-6 py-4 space-y-3 animate-slide-down">
            <Link href="/login" onClick={() => setMobileMenu(false)}
              className="block text-center text-brew-300 hover:text-cream-100 py-2 transition-colors">Sign In</Link>
            <Link href="/login" onClick={() => setMobileMenu(false)}
              className="block text-center bg-brew-500 text-white font-semibold py-3 rounded-xl">Get Started</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section ref={hero.ref} className="relative z-10 px-4 sm:px-6 pt-28 sm:pt-32 pb-20 sm:pb-28 max-w-4xl mx-auto text-center">
        <div className={`transition-all duration-700 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 bg-brew-800/50 border border-brew-700/50 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-brew-300">Free for small coffee shops</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-cream-100 leading-tight">
            Run your coffee shop
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brew-400 to-brew-300">
              like a pro
            </span>
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-brew-300 max-w-2xl mx-auto leading-relaxed px-2">
            A complete POS system with real-time orders, automatic inventory tracking,
            expense management, and profit reporting.
          </p>
        </div>
        <div className={`mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center transition-all duration-700 delay-200 ${
          hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Link href="/login"
            className="bg-brew-500 hover:bg-brew-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg transition-all shadow-lg shadow-brew-500/25 hover:shadow-xl hover:shadow-brew-500/30 active:scale-95 hover:-translate-y-0.5">
            ☕ Start Free
          </Link>
          <Link href="/login"
            className="bg-white/10 hover:bg-white/20 text-cream-100 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg transition-all border border-white/10 hover:border-white/25 active:scale-95">
            Try Demo →
          </Link>
        </div>
        <p className={`mt-4 text-xs text-brew-500 transition-all duration-700 delay-300 ${
          hero.visible ? 'opacity-100' : 'opacity-0'
        }`}>No credit card required · Sign up with Google</p>

        {/* Floating coffee cups */}
        <div className="hidden sm:block absolute -left-8 top-1/2 text-4xl animate-float-slow opacity-20">☕</div>
        <div className="hidden sm:block absolute -right-4 top-1/3 text-3xl animate-float-slower opacity-15">🧊</div>
        <div className="hidden sm:block absolute left-1/4 bottom-8 text-2xl animate-float-slow opacity-10">🥐</div>
      </section>

      {/* ── Stats bar ── */}
      <section ref={stats.ref} className={`relative z-10 px-4 sm:px-6 pb-16 transition-all duration-700 ${
        stats.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6 sm:p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-cream-100"><Counter target={8} /></p>
              <p className="text-xs sm:text-sm text-brew-400 mt-1">Core Modules</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-cream-100"><Counter target={3} /></p>
              <p className="text-xs sm:text-sm text-brew-400 mt-1">User Roles</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-cream-100"><Counter target={6} /></p>
              <p className="text-xs sm:text-sm text-brew-400 mt-1">Payment Methods</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-cream-100"><Counter target={100} suffix="%" /></p>
              <p className="text-xs sm:text-sm text-brew-400 mt-1">Free to Use</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={features.ref} className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 bg-cream-50">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-10 sm:mb-14 transition-all duration-700 ${
            features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-espresso-900">
              Everything you need to manage your shop
            </h2>
            <p className="mt-3 text-sm sm:text-base text-espresso-500 max-w-xl mx-auto">
              From taking orders to tracking profits — all in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className={`bg-white rounded-2xl p-4 sm:p-5 border border-brew-100 hover:shadow-lg hover:border-brew-300 hover:-translate-y-1 transition-all duration-300 group cursor-default ${
                  features.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: features.visible ? `${i * 80}ms` : '0ms' }}>
                <span className="text-2xl sm:text-3xl block mb-2 sm:mb-3 group-hover:scale-125 transition-transform duration-300">{f.icon}</span>
                <h3 className="font-display font-bold text-espresso-900 text-sm sm:text-base mb-1">{f.title}</h3>
                <p className="text-xs sm:text-sm text-espresso-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section ref={steps.ref} className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 bg-espresso-950">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-10 sm:mb-14 transition-all duration-700 ${
            steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-cream-100">
              Up and running in 3 steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-brew-400">Get started in under 5 minutes.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num}
                className={`text-center transition-all duration-700 ${
                  steps.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: steps.visible ? `${i * 150}ms` : '0ms' }}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-brew-500 to-brew-600 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mx-auto mb-4 shadow-lg shadow-brew-500/30 hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-cream-100 text-base sm:text-lg mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-brew-400">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:block absolute top-1/2 right-0 translate-x-1/2 text-brew-600 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section ref={roles.ref} className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 bg-cream-50">
        <div className="max-w-4xl mx-auto">
          <div className={`text-center mb-10 sm:mb-14 transition-all duration-700 ${
            roles.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-espresso-900">
              Role-based access control
            </h2>
            <p className="mt-3 text-sm sm:text-base text-espresso-500">Each role sees only what they need.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-5">
            {ROLES.map((r, i) => (
              <div key={r.role}
                className={`bg-white rounded-2xl p-5 sm:p-6 border border-brew-100 ${r.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${
                  roles.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: roles.visible ? `${i * 120}ms` : '0ms' }}>
                <span className={`badge text-sm mb-4 ${r.color}`}>{r.role}</span>
                <ul className="space-y-2.5">
                  {r.perms.map(p => (
                    <li key={p} className="flex items-center gap-2 text-sm text-espresso-700">
                      <span className="text-green-500 text-base">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Payment methods ── */}
      <section ref={payments.ref} className="relative z-10 px-4 sm:px-6 py-16 sm:py-20 bg-espresso-950">
        <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
          payments.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-cream-100 mb-3 sm:mb-4">
            Accept payments your way
          </h2>
          <p className="text-sm sm:text-base text-brew-400 mb-8 sm:mb-10">Support for the most popular Philippine payment methods.</p>
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-3 sm:gap-4">
            {PAYMENTS.map((m, i) => (
              <div key={m.label}
                className={`bg-white/10 border border-white/10 rounded-2xl px-4 sm:px-6 py-3 text-cream-100 font-medium hover:bg-white/20 hover:border-white/25 hover:scale-105 transition-all duration-300 cursor-default ${
                  payments.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                }`}
                style={{ transitionDelay: payments.visible ? `${i * 80}ms` : '0ms' }}>
                <span className="text-xl sm:text-2xl block mb-1">{m.icon}</span>
                <span className="text-xs sm:text-sm">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={cta.ref} className="relative z-10 px-4 sm:px-6 py-20 sm:py-28 bg-gradient-to-b from-brew-800 to-brew-900 overflow-hidden">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[500px] border border-brew-600/10 rounded-full animate-ping-slow" />
          <div className="absolute w-[350px] h-[350px] border border-brew-500/10 rounded-full animate-ping-slower" />
        </div>
        <div className={`max-w-3xl mx-auto text-center relative transition-all duration-700 ${
          cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <span className="text-5xl sm:text-6xl block mb-6 animate-bounce-slow">☕</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-cream-100 mb-4">
            Ready to brew success?
          </h2>
          <p className="text-sm sm:text-lg text-brew-300 mb-8 sm:mb-10 px-4">
            Join coffee shop owners who manage their business smarter with BrewPOS.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/login"
              className="bg-white text-espresso-900 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg hover:bg-cream-100 transition-all shadow-lg hover:shadow-xl active:scale-95 hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <Link href="/login"
              className="bg-white/10 hover:bg-white/20 text-cream-100 font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-base sm:text-lg transition-all border border-white/20 hover:border-white/30 active:scale-95">
              Try Demo Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 bg-espresso-950 border-t border-espresso-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">☕</span>
            <span className="font-display font-bold text-cream-100">BrewPOS</span>
            <span className="text-xs text-espresso-500 ml-2 hidden sm:inline">Built for small coffee shop owners</span>
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

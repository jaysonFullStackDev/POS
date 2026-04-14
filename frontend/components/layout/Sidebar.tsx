'use client';
// components/layout/Sidebar.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/store/AuthContext';
import { api } from '@/lib/api';
import clsx from 'clsx';
import {
  LayoutDashboard, ShoppingCart, ChefHat, Receipt, Package,
  Coffee, Wallet, BarChart3, Users, ScrollText, Lock, LogOut, X
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',          label: 'Dashboard',    Icon: LayoutDashboard, roles: ['admin','manager','cashier'] },
  { href: '/pos',                label: 'Point of Sale', Icon: ShoppingCart,   roles: ['admin','manager','cashier'] },
  { href: '/kitchen',            label: 'Kitchen',       Icon: ChefHat,        roles: ['admin','manager','cashier'] },
  { href: '/pos/history',        label: 'Sales History', Icon: Receipt,        roles: ['admin','manager','cashier'] },
  { href: '/inventory',          label: 'Inventory',     Icon: Package,        roles: ['admin','manager'] },
  { href: '/inventory/products', label: 'Products',      Icon: Coffee,         roles: ['admin','manager'] },
  { href: '/accounting',         label: 'Accounting',    Icon: Wallet,         roles: ['admin','manager'] },
  { href: '/reports',            label: 'Reports',       Icon: BarChart3,      roles: ['admin','manager'] },
  { href: '/dashboard/users',    label: 'Staff',         Icon: Users,          roles: ['admin'] },
  { href: '/audit',              label: 'Audit Log',     Icon: ScrollText,     roles: ['admin'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [busy,    setBusy]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setBusy(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-display font-bold text-espresso-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" /> Change Password
        </h3>

        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-3 p-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Current Password</label>
            <input type="password" value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="input" placeholder="Enter current password" required />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">New Password</label>
            <input type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input" placeholder="At least 6 characters" required />
          </div>
          <div>
            <label className="text-xs font-medium text-espresso-600 block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="input" placeholder="Re-enter new password" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showChangePw, setShowChangePw] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (user && ['admin', 'manager'].includes(user.role)) {
      const fetchLowStock = () => {
        api.inventory.lowStock()
          .then(items => setLowStockCount(Array.isArray(items) ? items.length : 0))
          .catch(() => {});
      };
      const timeout = setTimeout(fetchLowStock, 2000);
      const interval = setInterval(fetchLowStock, 60_000);
      return () => { clearTimeout(timeout); clearInterval(interval); };
    }
  }, [user]);

  const allowedNav = NAV.filter(n =>
    user ? n.roles.includes(user.role) : false
  );

  const roleBadgeColor: Record<string, string> = {
    admin:   'bg-red-100 text-red-700',
    manager: 'bg-blue-100 text-blue-700',
    cashier: 'bg-green-100 text-green-700',
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 flex flex-col w-56 bg-espresso-950 text-cream-100 transition-transform duration-200 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-espresso-800">
          <div className="flex items-center gap-3">
            <Coffee className="w-7 h-7 text-brew-400" />
            <div>
              <p className="font-display font-bold text-cream-100 text-lg leading-tight">BrewPOS</p>
              <p className="text-espresso-400 text-xs">Coffee Manager</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-espresso-400 hover:text-cream-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {allowedNav.map(link => {
            const active = pathname === link.href || (!['/pos', '/inventory', '/dashboard'].includes(link.href) && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-brew-600 text-white shadow-md'
                    : 'text-espresso-300 hover:bg-espresso-800 hover:text-cream-100'
                )}
              >
                <link.Icon className="w-4.5 h-4.5" />
                {link.label}
                {link.href === '/inventory' && lowStockCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {lowStockCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + actions */}
        <div className="border-t border-espresso-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brew-500 flex items-center justify-center
                            text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-cream-100 text-sm font-medium truncate">{user?.name}</p>
              <span className={clsx('badge text-xs capitalize', roleBadgeColor[user?.role || 'cashier'])}>
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowChangePw(true)}
            className="w-full text-left text-xs text-espresso-400 hover:text-brew-400
                       transition-colors py-1 px-1 mb-1 flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" /> Change Password
          </button>
          <button
            onClick={logout}
            className="w-full text-left text-xs text-espresso-400 hover:text-red-400
                       transition-colors py-1 px-1 flex items-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {showChangePw && (
        <ChangePasswordModal onClose={() => setShowChangePw(false)} />
      )}
    </>
  );
}

'use client';
// components/ui/Toast.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import clsx from 'clsx';

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'error' | 'demo';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id}
            className={clsx(
              'pointer-events-auto rounded-2xl shadow-lg border p-4 animate-slide-in',
              toast.type === 'demo'  && 'bg-amber-50 border-amber-200',
              toast.type === 'error' && 'bg-red-50 border-red-200',
              toast.type === 'info'  && 'bg-blue-50 border-blue-200',
            )}>
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">
                {toast.type === 'demo' ? '🔒' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-semibold',
                  toast.type === 'demo'  && 'text-amber-800',
                  toast.type === 'error' && 'text-red-800',
                  toast.type === 'info'  && 'text-blue-800',
                )}>
                  {toast.type === 'demo' ? 'Demo Mode' : toast.type === 'error' ? 'Error' : 'Info'}
                </p>
                <p className={clsx('text-sm mt-0.5',
                  toast.type === 'demo'  && 'text-amber-700',
                  toast.type === 'error' && 'text-red-700',
                  toast.type === 'info'  && 'text-blue-700',
                )}>
                  {toast.message}
                </p>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

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
  const [toast, setToast] = useState<Toast | null>(null);

  const dismiss = useCallback(() => setToast(null), []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
    const id = ++toastId;
    setToast({ id, message, type });
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={dismiss}>
          <div className="absolute inset-0 bg-black/30" />
          <div className={clsx(
            'relative w-full max-w-sm rounded-3xl shadow-2xl border-2 p-6 animate-pop-in',
            toast.type === 'demo'  && 'bg-amber-50 border-amber-300',
            toast.type === 'error' && 'bg-red-50 border-red-300',
            toast.type === 'info'  && 'bg-blue-50 border-blue-300',
          )} onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <span className="text-4xl block mb-3">
                {toast.type === 'demo' ? '🔒' : toast.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <h3 className={clsx('text-lg font-display font-bold mb-2',
                toast.type === 'demo'  && 'text-amber-900',
                toast.type === 'error' && 'text-red-900',
                toast.type === 'info'  && 'text-blue-900',
              )}>
                {toast.type === 'demo' ? 'Demo Mode' : toast.type === 'error' ? 'Oops!' : 'Info'}
              </h3>
              <p className={clsx('text-sm leading-relaxed',
                toast.type === 'demo'  && 'text-amber-700',
                toast.type === 'error' && 'text-red-700',
                toast.type === 'info'  && 'text-blue-700',
              )}>
                {toast.message}
              </p>
            </div>
            <button onClick={dismiss}
              className={clsx('w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                toast.type === 'demo'  && 'bg-amber-200 hover:bg-amber-300 text-amber-900',
                toast.type === 'error' && 'bg-red-200 hover:bg-red-300 text-red-900',
                toast.type === 'info'  && 'bg-blue-200 hover:bg-blue-300 text-blue-900',
              )}>
              Got it
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

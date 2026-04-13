// lib/useDemoGuard.ts
'use client';

import { useToast } from '@/components/ui/Toast';
import { useCallback } from 'react';

export function useDemoGuard() {
  const { showToast } = useToast();

  const guardedAction = useCallback(async <T>(action: () => Promise<T>): Promise<T | null> => {
    try {
      return await action();
    } catch (err: any) {
      if (err.isDemo) {
        showToast(err.message, 'demo');
      } else {
        showToast(err.message || 'Something went wrong', 'error');
      }
      return null;
    }
  }, [showToast]);

  return { guardedAction };
}

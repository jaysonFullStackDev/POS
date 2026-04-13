'use client';
// store/AuthContext.tsx
// Global auth state — wraps entire app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, clearToken, getToken, setRefreshToken, getRefreshToken } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isManager: boolean;
  canManage: boolean;
  needsSetup: boolean;
  markSetupDone: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [loading, setLoading]     = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api.auth.me()
        .then(u => {
          setUser(u);
          setNeedsSetup(!u.is_setup_done);
        })
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthResponse = useCallback((data: { token: string; refreshToken: string; user: any; is_setup_done?: boolean }) => {
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
    setNeedsSetup(!data.is_setup_done);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.auth.login(email, password);
    handleAuthResponse(data);
  }, [handleAuthResponse]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const data = await api.auth.google(credential);
    handleAuthResponse(data);
  }, [handleAuthResponse]);

  const logout = useCallback(() => {
    const email = user?.email;
    api.auth.logout(getRefreshToken(), email);
    clearToken();
    setUser(null);
    setNeedsSetup(false);
  }, [user]);

  const markSetupDone = useCallback(() => setNeedsSetup(false), []);

  return (
    <AuthContext.Provider value={{
      user, loading, login, loginWithGoogle, logout,
      isAdmin:   user?.role === 'admin',
      isManager: user?.role === 'manager',
      canManage: user?.role === 'admin' || user?.role === 'manager',
      needsSetup,
      markSetupDone,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

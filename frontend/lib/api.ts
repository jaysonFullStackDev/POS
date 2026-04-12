// lib/api.ts
// Typed API client — all HTTP calls go through here

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Token helpers ─────────────────────────────────────────
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('brewpos_token') : null;

export const setToken = (token: string): void =>
  localStorage.setItem('brewpos_token', token);

export const clearToken = (): void => {
  localStorage.removeItem('brewpos_token');
  localStorage.removeItem('brewpos_refresh_token');
};

export const getRefreshToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('brewpos_refresh_token') : null;

export const setRefreshToken = (token: string): void =>
  localStorage.setItem('brewpos_refresh_token', token);

// ── Refresh lock (prevents concurrent refresh calls) ──────
let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) {
      clearToken();
      return false;
    }
    const data = await res.json();
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Core fetch wrapper with response caching ─────────────
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  useCache = false
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  // Only cache GET requests
  if (useCache && method === 'GET') {
    const cached = getCached<T>(path);
    if (cached) return cached;
  }

  // Invalidate cache on mutations
  if (method !== 'GET') {
    cache.clear();
  }

  const doFetch = () => {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${BASE_URL}/api${path}`, { ...options, headers });
  };

  let res = await doFetch();

  // On 401, attempt a single token refresh then retry
  if (res.status === 401 && getRefreshToken()) {
    if (!refreshPromise) refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
    const ok = await refreshPromise;
    if (ok) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const err = await res.json();
        errMsg = err.error || errMsg;
      }
    } catch {}
    throw new Error(errMsg);
  }

  const data: T = await res.json();

  // Cache successful GET responses
  if (useCache && method === 'GET') {
    cache.set(path, { data, ts: Date.now() });
  }

  return data;
}

// ── Auth ──────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ token: string; refreshToken: string; user: any; is_setup_done: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    google: (credential: string) =>
      apiFetch<{ token: string; refreshToken: string; user: any; is_setup_done: boolean }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }),
    logout: (refreshToken: string | null) =>
      fetch(`${BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {}),
    me: () => apiFetch<any>('/auth/me'),
    tenant: () => apiFetch<any>('/auth/tenant'),
    tenantSetup: (data: any) =>
      apiFetch<any>('/auth/tenant-setup', { method: 'PUT', body: JSON.stringify(data) }),
    getUsers: () => apiFetch<any[]>('/auth/users'),
    createUser: (data: any) =>
      apiFetch<any>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
    changePassword: (currentPassword: string, newPassword: string) =>
      apiFetch<any>('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  // ── Products ─────────────────────────────────────────────
  products: {
    list: () => apiFetch<any[]>('/products', {}, true),
    get: (id: string) => apiFetch<any>(`/products/${id}`, {}, true),
    create: (data: any) =>
      apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => apiFetch<any[]>('/categories', {}, true),
    create: (data: any) =>
      apiFetch<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  },

  // ── Sales ─────────────────────────────────────────────────
  sales: {
    process: (data: any) =>
      apiFetch<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/sales${qs}`);
    },
    get: (id: string) => apiFetch<any>(`/sales/${id}`),
  },

  // ── Orders / Kitchen ──────────────────────────────────────
  orders: {
    active: () => apiFetch<any[]>('/orders/active'),
    updateStatus: (id: string, status: string) =>
      apiFetch<any>(`/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // ── Inventory ─────────────────────────────────────────────
  inventory: {
    ingredients: {
      list: () => apiFetch<any[]>('/inventory/ingredients', {}, true),
      create: (data: any) =>
        apiFetch<any>('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        apiFetch<any>(`/inventory/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    lowStock: () => apiFetch<any[]>('/inventory/low-stock', {}, true),
    addMovement: (data: any) =>
      apiFetch<any>('/inventory/stock-movement', { method: 'POST', body: JSON.stringify(data) }),
    movements: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/inventory/movements${qs}`);
    },
    suppliers: {
      list: () => apiFetch<any[]>('/inventory/suppliers', {}, true),
      create: (data: any) =>
        apiFetch<any>('/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    },
  },

  // ── Accounting ────────────────────────────────────────────
  accounting: {
    expenses: {
      list: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : '';
        return apiFetch<any[]>(`/accounting/expenses${qs}`);
      },
      create: (data: any) =>
        apiFetch<any>('/accounting/expenses', { method: 'POST', body: JSON.stringify(data) }),
    },
    pnl: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/accounting/pnl${qs}`);
    },
    cashflow: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/accounting/cashflow${qs}`);
    },
  },

  // ── Reports ───────────────────────────────────────────────
  reports: {
    salesSummary: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/reports/sales-summary${qs}`);
    },
    topProducts: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/reports/top-products${qs}`);
    },
    inventoryUsage: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/reports/inventory-usage${qs}`);
    },
    dashboard: () => apiFetch<any>('/reports/dashboard'),
  },

  // ── Audit Logs ─────────────────────────────────────────
  audit: {
    logs: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any>(`/audit/logs${qs}`);
    },
  },
};

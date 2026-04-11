// lib/api.ts
// Typed API client — all HTTP calls go through here

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Token helpers ─────────────────────────────────────────
export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('brewpos_token') : null;

export const setToken = (token: string): void =>
  localStorage.setItem('brewpos_token', token);

export const clearToken = (): void =>
  localStorage.removeItem('brewpos_token');

// ── Core fetch wrapper ────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => apiFetch<any>('/auth/me'),
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
    list: () => apiFetch<any[]>('/products'),
    get: (id: string) => apiFetch<any>(`/products/${id}`),
    create: (data: any) =>
      apiFetch<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      apiFetch<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      apiFetch<any>(`/products/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: () => apiFetch<any[]>('/categories'),
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
      list: () => apiFetch<any[]>('/inventory/ingredients'),
      create: (data: any) =>
        apiFetch<any>('/inventory/ingredients', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: any) =>
        apiFetch<any>(`/inventory/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    lowStock: () => apiFetch<any[]>('/inventory/low-stock'),
    addMovement: (data: any) =>
      apiFetch<any>('/inventory/stock-movement', { method: 'POST', body: JSON.stringify(data) }),
    movements: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiFetch<any[]>(`/inventory/movements${qs}`);
    },
    suppliers: {
      list: () => apiFetch<any[]>('/inventory/suppliers'),
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

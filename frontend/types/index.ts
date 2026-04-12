// types/index.ts
// Shared TypeScript interfaces for BrewPOS

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  avatar_url?: string;
  is_active?: boolean;
  is_setup_done?: boolean;
  company_name?: string;
  created_at?: string;
}

export interface Tenant {
  id: string;
  company_name: string;
  address?: string;
  phone?: string;
  is_setup_done: boolean;
  payment_config: PaymentConfig;
  created_at: string;
}

export interface PaymentProviderConfig {
  enabled: boolean;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
}

export interface PaymentConfig {
  gcash?: PaymentProviderConfig;
  maya?: PaymentProviderConfig;
  gotyme?: PaymentProviderConfig;
  bank_transfer?: PaymentProviderConfig;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category_id: string;
  category_name?: string;
  category_color?: string;
  is_available: boolean;
  image_url?: string;
  recipe?: RecipeItem[];
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_qty: number;
  low_stock_alert: number;
  cost_per_unit: number;
  supplier_id?: string;
  supplier_name?: string;
  is_low_stock?: boolean;
}

export interface RecipeItem {
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  quantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// ── Cart / POS ────────────────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'ewallet' | 'gcash' | 'maya' | 'gotyme' | 'bank_transfer';

// ── Sales ─────────────────────────────────────────────────
export interface Sale {
  id: string;
  sale_number: string;
  cashier_id: string;
  cashier_name?: string;
  subtotal: number;
  discount: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_tendered?: number;
  change_due: number;
  notes?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

// ── Expenses ──────────────────────────────────────────────
export type ExpenseCategory =
  | 'ingredients' | 'utilities' | 'salaries'
  | 'rent' | 'equipment' | 'marketing' | 'other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

// ── Stock Movements ───────────────────────────────────────
export type MovementType = 'purchase' | 'sale_deduction' | 'wastage' | 'adjustment';

export interface StockMovement {
  id: string;
  ingredient_id: string;
  ingredient_name?: string;
  unit?: string;
  movement_type: MovementType;
  quantity_change: number;
  notes?: string;
  sale_id?: string;
  recorded_by?: string;
  recorded_by_name?: string;
  created_at: string;
}

// ── Kitchen / Orders ──────────────────────────────────────
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed';

export interface KitchenOrder {
  id: string;
  sale_number: string;
  order_status: OrderStatus;
  created_at: string;
  notes?: string;
  cashier_name?: string;
  items: { product_name: string; quantity: number }[];
}

// ── Reports ───────────────────────────────────────────────
export interface SalesSummaryRow {
  period: string;
  transaction_count: number;
  revenue: number;
  discounts: number;
  tax: number;
  avg_transaction: number;
}

export interface TopProduct {
  product_name: string;
  units_sold: number;
  revenue: number;
}

export interface PnLReport {
  period: { from: string; to: string };
  gross_sales: number;
  total_discounts: number;
  total_tax: number;
  net_revenue: number;
  transaction_count: number;
  expenses_by_category: { category: string; total: number }[];
  total_expenses: number;
  gross_profit: number;
  profit_margin: number;
}

export interface CashFlowMonth {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface DashboardStats {
  today: { transactions: number; revenue: number };
  this_month: { revenue: number };
  low_stock_count: number;
  top_product_today: { product_name: string; units: number } | null;
}

// ── Audit Logs ─────────────────────────────────────────
export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

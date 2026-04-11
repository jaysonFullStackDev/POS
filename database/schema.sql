-- ============================================================
-- BrewPOS - Coffee Shop POS System
-- Database Schema (PostgreSQL)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Stores staff accounts with role-based access
-- ============================================================
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,        -- bcrypt hashed
  role        VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SUPPLIERS TABLE
-- Vendor/supplier information for procurement
-- ============================================================
CREATE TABLE suppliers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(150) NOT NULL,
  contact     VARCHAR(100),
  phone       VARCHAR(30),
  email       VARCHAR(150),
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- Product categories (Beverages, Pastries, etc.)
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) NOT NULL,
  color       VARCHAR(7) DEFAULT '#8B6F47',  -- hex color for UI
  icon        VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INGREDIENTS TABLE
-- Raw materials/stock items tracked at ingredient level
-- ============================================================
CREATE TABLE ingredients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  unit            VARCHAR(20) NOT NULL,        -- g, ml, pcs, kg, L
  stock_qty       DECIMAL(10,3) DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_alert DECIMAL(10,3) DEFAULT 100,   -- threshold for alert
  cost_per_unit   DECIMAL(10,4) DEFAULT 0,     -- cost per unit for COGS
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS TABLE
-- Items sold at the POS
-- ============================================================
CREATE TABLE products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(150) NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT TRUE,
  image_url    VARCHAR(500),
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RECIPES TABLE
-- Links products to ingredients (bill of materials)
-- ============================================================
CREATE TABLE recipes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id  UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity       DECIMAL(10,3) NOT NULL,   -- amount of ingredient per 1 unit of product
  UNIQUE(product_id, ingredient_id)
);

-- ============================================================
-- SALES TABLE
-- Header record for each transaction
-- ============================================================
CREATE TABLE sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_number     VARCHAR(20) UNIQUE NOT NULL,  -- e.g. TXN-20240101-0001
  cashier_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  subtotal        DECIMAL(10,2) NOT NULL,
  discount        DECIMAL(10,2) DEFAULT 0,
  tax_amount      DECIMAL(10,2) DEFAULT 0,
  total_amount    DECIMAL(10,2) NOT NULL,
  payment_method  VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'ewallet')),
  amount_tendered DECIMAL(10,2),             -- for cash: amount given by customer
  change_due      DECIMAL(10,2) DEFAULT 0,
  notes           TEXT,
  order_status    VARCHAR(20) DEFAULT 'pending'
                    CHECK (order_status IN ('pending', 'preparing', 'ready', 'completed')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SALE_ITEMS TABLE
-- Line items for each sale
-- ============================================================
CREATE TABLE sale_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id     UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(150) NOT NULL,   -- snapshot at time of sale
  unit_price  DECIMAL(10,2) NOT NULL,
  quantity    INTEGER NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- EXPENSES TABLE
-- Record all business expenses (ingredients, utilities, salaries)
-- ============================================================
CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category     VARCHAR(50) NOT NULL CHECK (category IN (
                  'ingredients', 'utilities', 'salaries',
                  'rent', 'equipment', 'marketing', 'other'
               )),
  description  TEXT NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  recorded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- STOCK_MOVEMENTS TABLE
-- Audit log for all inventory changes
-- ============================================================
CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id   UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  movement_type   VARCHAR(20) NOT NULL CHECK (movement_type IN (
                    'purchase', 'sale_deduction', 'wastage', 'adjustment'
                  )),
  quantity_change DECIMAL(10,3) NOT NULL,   -- positive = in, negative = out
  notes           TEXT,
  sale_id         UUID REFERENCES sales(id) ON DELETE SET NULL,
  recorded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- AUDIT_LOGS TABLE
-- Tracks all important actions for accountability
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(100),
  user_role   VARCHAR(20),
  action      VARCHAR(50) NOT NULL,
  entity      VARCHAR(50),
  entity_id   VARCHAR(100),
  details     JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_sales_created_at    ON sales(created_at);
CREATE INDEX idx_sales_cashier       ON sales(cashier_id);
CREATE INDEX idx_sale_items_sale     ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product  ON sale_items(product_id);
CREATE INDEX idx_expenses_date       ON expenses(expense_date);
CREATE INDEX idx_stock_movements_ing ON stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_sales_order_status   ON sales(order_status);
CREATE INDEX idx_audit_logs_user       ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_created    ON audit_logs(created_at);

-- ============================================================
-- HELPER FUNCTION: auto-update updated_at timestamps
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

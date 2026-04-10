# ☕ BrewPOS — Coffee Shop POS System

A full-stack Point of Sale, Inventory Management, and Accounting system built for small coffee shops.

---

## 🏗️ Architecture Overview

```
brewpos/
├── backend/                    # Express.js REST API (Node.js)
│   ├── controllers/            # Business logic per domain
│   │   ├── authController.js       - Login, JWT, user management
│   │   ├── productsController.js   - Menu items & categories
│   │   ├── salesController.js      - POS transactions (DB tx)
│   │   ├── inventoryController.js  - Stock, movements, suppliers
│   │   ├── accountingController.js - Expenses, P&L, cash flow
│   │   └── reportsController.js    - Analytics & dashboard
│   ├── middleware/
│   │   └── auth.js             - JWT authentication & RBAC
│   ├── routes/
│   │   └── index.js            - All API route definitions
│   ├── db/
│   │   ├── pool.js             - PostgreSQL connection pool
│   │   └── hash-seed-passwords.js - Seed password utility
│   ├── server.js               - Express app entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Next.js 14 (App Router) + TypeScript
│   ├── app/
│   │   ├── layout.tsx          - Root layout + global providers
│   │   ├── globals.css         - Tailwind + custom design tokens
│   │   ├── page.tsx            - Root redirect
│   │   ├── login/page.tsx      - Login screen
│   │   ├── dashboard/page.tsx  - Dashboard with charts
│   │   ├── pos/page.tsx        - Point of Sale cashier screen
│   │   ├── inventory/page.tsx  - Inventory management
│   │   ├── accounting/page.tsx - Expenses & P&L
│   │   └── reports/page.tsx    - Analytics & reports
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx     - Navigation sidebar
│   │       └── AppShell.tsx    - Auth guard + layout wrapper
│   ├── store/
│   │   ├── AuthContext.tsx     - Auth state (React Context)
│   │   └── CartContext.tsx     - POS cart state
│   ├── lib/
│   │   └── api.ts              - Typed API client
│   ├── types/
│   │   └── index.ts            - All TypeScript interfaces
│   └── package.json
│
└── database/
    ├── schema.sql              - All tables, indexes, triggers
    └── seed.sql                - Sample products, ingredients, users
```

---

## 🚀 Local Setup

### Prerequisites

- **Node.js** v18+
- **PostgreSQL** v14+
- **npm** or **yarn**

---

### Step 1 — Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE brewpos;
\q

# Run schema (creates all tables)
psql -U postgres -d brewpos -f database/schema.sql

# Run seed data
psql -U postgres -d brewpos -f database/seed.sql
```

---

### Step 2 — Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret

# Hash the seed passwords (IMPORTANT — do this after seeding)
node db/hash-seed-passwords.js

# Start development server
npm run dev
# → API running on http://localhost:4000
```

**Verify the API:**
```bash
curl http://localhost:4000/health
# Should return: {"status":"ok","service":"BrewPOS API",...}
```

---

### Step 3 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

# Start development server
npm run dev
# → App running on http://localhost:3000
```

---

### Step 4 — Login

Open [http://localhost:3000](http://localhost:3000) and use the demo credentials:

| Role     | Email                   | Password      |
|----------|-------------------------|---------------|
| Admin    | admin@brewpos.com       | Admin@123     |
| Manager  | manager@brewpos.com     | Manager@123   |
| Cashier  | cashier@brewpos.com     | Cashier@123   |

---

## 🔐 Role Permissions

| Feature              | Admin | Manager | Cashier |
|----------------------|-------|---------|---------|
| Dashboard            | ✅    | ✅      | ✅      |
| Point of Sale (POS)  | ✅    | ✅      | ✅      |
| Inventory            | ✅    | ✅      | ❌      |
| Accounting           | ✅    | ✅      | ❌      |
| Reports              | ✅    | ✅      | ❌      |
| User Management      | ✅    | ❌      | ❌      |
| Delete Products      | ✅    | ❌      | ❌      |

---

## 📡 API Reference

### Authentication
```
POST   /api/auth/login       - Login (returns JWT)
GET    /api/auth/me          - Get current user
GET    /api/auth/users       - List users (admin/manager)
POST   /api/auth/users       - Create user (admin only)
```

### Products
```
GET    /api/products         - List all products
GET    /api/products/:id     - Product with recipe
POST   /api/products         - Create product
PUT    /api/products/:id     - Update product
DELETE /api/products/:id     - Delete product
GET    /api/categories       - List categories
```

### Sales / POS
```
POST   /api/sales            - Process sale (deducts stock)
GET    /api/sales            - List sales (?from=&to=&page=)
GET    /api/sales/:id        - Sale with items
```

### Inventory
```
GET    /api/inventory/ingredients       - All ingredients + low-stock flag
POST   /api/inventory/ingredients       - Create ingredient
PUT    /api/inventory/ingredients/:id   - Update ingredient
GET    /api/inventory/low-stock         - Only low-stock items
POST   /api/inventory/stock-movement    - Purchase / wastage / adjustment
GET    /api/inventory/movements         - Stock movement log
GET    /api/inventory/suppliers         - List suppliers
POST   /api/inventory/suppliers         - Create supplier
```

### Accounting
```
POST   /api/accounting/expenses         - Record expense
GET    /api/accounting/expenses         - List expenses (?from=&to=&category=)
GET    /api/accounting/pnl              - P&L report (?from=&to=)
GET    /api/accounting/cashflow         - Monthly cashflow (?year=)
```

### Reports
```
GET    /api/reports/dashboard           - Dashboard KPI cards
GET    /api/reports/sales-summary       - Sales by period (?period=daily|weekly|monthly)
GET    /api/reports/top-products        - Top products (?from=&to=&limit=)
GET    /api/reports/inventory-usage     - Ingredient consumption + COGS
```

---

## 💰 Key Business Logic

### Sale Transaction (Atomic)
When a sale is processed (`POST /api/sales`), the backend:
1. Validates all products are available
2. Calculates subtotal → applies discount → computes 12% VAT → derives total
3. Generates a unique receipt number (`TXN-YYYYMMDD-XXXX`)
4. Inserts sale header + sale line items
5. Fetches each product's recipe and deducts ingredients from stock
6. Logs every stock deduction in `stock_movements`
7. All steps in a single DB transaction — partial failures roll back completely

### Stock Auto-Deduction
Each product has a **recipe** (ingredients + quantities per unit sold). When a Latte is sold:
- 18g Espresso Beans deducted
- 200ml Fresh Milk deducted
- 1 Paper Cup (12oz) deducted

### Profit & Loss
`GET /api/accounting/pnl` computes:
```
Gross Sales
  – Discounts
  + VAT Collected
= Net Revenue
  – Ingredients expenses
  – Utilities expenses
  – Salaries expenses
  – Rent, Equipment, Marketing, Other
= Gross Profit
```

---

## 🌐 Deployment (Vercel + Supabase)

### Database: Supabase (PostgreSQL)
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste `database/schema.sql`, then `database/seed.sql`
3. Copy the connection string from **Settings → Database**

### Backend: Vercel
```bash
cd backend
npm install -g vercel
vercel
# Set environment variables in Vercel dashboard:
# DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD (from Supabase)
# JWT_SECRET, NODE_ENV=production
# Add: ssl: { rejectUnauthorized: false } to pool.js for Supabase
```

### Frontend: Vercel
```bash
cd frontend
vercel
# Set environment variable:
# NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## 🐳 Docker (Optional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: brewpos
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      DB_HOST: db
      DB_NAME: brewpos
      DB_USER: postgres
      DB_PASSWORD: postgres
      JWT_SECRET: change-me-in-production
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000
```

```bash
docker-compose up --build
```

---

## 🧱 Database Schema

| Table             | Purpose                                       |
|-------------------|-----------------------------------------------|
| `users`           | Staff accounts with role (admin/manager/cashier) |
| `categories`      | Product categories with colors                |
| `products`        | Menu items with prices                        |
| `ingredients`     | Raw materials with stock levels               |
| `recipes`         | Links products → ingredients (BOM)            |
| `suppliers`       | Vendor contact information                    |
| `sales`           | Transaction headers                           |
| `sale_items`      | Line items per transaction                    |
| `expenses`        | Business expense records                      |
| `stock_movements` | Full audit log of all stock changes           |

---

## 🔒 Security

- Passwords hashed with **bcrypt** (10 rounds)
- JWT tokens expire in **8 hours**
- All protected routes require `Authorization: Bearer <token>`
- Role-based access control enforced at middleware level
- SQL queries use **parameterized statements** (no SQL injection)
- CORS restricted to configured origins

---

## 📦 Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Frontend   | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| State      | React Context (Auth + Cart)                    |
| Charts     | Recharts                                       |
| Backend    | Express.js · Node.js                           |
| Auth       | JWT (jsonwebtoken) · bcryptjs                  |
| Database   | PostgreSQL (via `pg` pool)                     |
| Hosting    | Vercel (frontend + backend) · Supabase (DB)    |

---

## 📝 Extending the System

**Add a new product category:**
```sql
INSERT INTO categories (name, color, icon) VALUES ('Smoothies', '#4CAF50', 'glass');
```

**Add a new product with recipe:**
```bash
POST /api/products
{
  "name": "Green Matcha Smoothie",
  "price": 195,
  "category_id": "<uuid>",
  "recipe": [
    { "ingredient_id": "<matcha-uuid>", "quantity": 10 },
    { "ingredient_id": "<milk-uuid>",   "quantity": 250 }
  ]
}
```

**Add a new expense category:**
Edit the CHECK constraint in `schema.sql` and the frontend `EXPENSE_CATS` array.

---

Built with ☕ for small coffee shop owners.

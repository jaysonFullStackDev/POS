# ☕ BrewPOS — Coffee Shop POS System

A full-stack, multi-tenant Point of Sale system built for small coffee shops. Real-time kitchen display, automatic inventory deduction, expense tracking, P&L reporting, and audit logging — all in one app.

### 🔗 [Live Demo](https://brewpos.vercel.app) · [Backend Repo](https://github.com/jaysonFullStackDev/BrewPOS-Backend)

> **Try it now** — Login with `admin@brewpos.com` / `Admin@123` or sign up with Google to create your own shop.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🛒 **Point of Sale** | Fast product search, category filters, cart management, dine-in/take-out toggle |
| 👨‍🍳 **Kitchen Display** | Real-time Kanban board (New → Preparing → Ready) via WebSocket |
| 📦 **Inventory** | Recipe-based auto-deduction, low stock alerts, supplier management |
| 💰 **Accounting** | Expense tracking, P&L reports, monthly cash flow charts |
| 📊 **Dashboard** | Today's revenue, transaction count, top products, low stock warnings |
| 🧾 **Receipt Printing** | Thermal receipt format (58mm), opens in print-ready window |
| 👥 **Staff Management** | Create staff with role-based access (Admin/Manager/Cashier) |
| 📜 **Audit Log** | Tracks every action — who did what, when, from where |
| 🔐 **Multi-tenant** | Each shop's data is fully isolated. Sign up with Google to create a new tenant |
| 💳 **Payment Methods** | Cash, GCash, Maya, GoTyme, Bank Transfer |

---

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐     SQL      ┌──────────────┐
│   Next.js 14    │◄──────────────────►│   Express.js    │◄────────────►│  PostgreSQL   │
│   (Vercel)      │     REST API       │   (Render)      │              │  (Supabase)   │
│                 │◄──────────────────►│                 │              │              │
└─────────────────┘                    └─────────────────┘              └──────────────┘
     Frontend                              Backend                        Database
```

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS · Recharts · Socket.IO Client |
| Backend | Express.js · Node.js · Socket.IO · JWT · Helmet · express-validator |
| Database | PostgreSQL (Supabase) · UUID primary keys · JSONB for audit details |
| Auth | Google OAuth 2.0 · JWT access + refresh tokens · Refresh token rotation |
| CI/CD | GitHub Actions → Lint → Test → Deploy (Vercel + Render) |

---

## 🔐 Security

- **Rate limiting** — 5 login attempts/15min, 100 API requests/min per IP
- **Input validation** — express-validator on all mutation endpoints
- **Helmet.js** — Secure HTTP headers (XSS, clickjacking, MIME sniffing)
- **JWT + Refresh tokens** — Access token (15min) + refresh token rotation with reuse detection
- **Account lockout** — Locks after 5 failed login attempts
- **Input sanitization** — Strips HTML/script tags from all string inputs
- **Row-level locking** — `SELECT FOR UPDATE` prevents race conditions on inventory
- **DB constraint** — `CHECK (stock_qty >= 0)` as safety net against overselling
- **Audit logging** — Every mutation is logged with user, action, details, and IP

---

## 🔐 Role Permissions

| Feature | Admin | Manager | Cashier |
|---------|-------|---------|---------|
| Dashboard | ✅ | ✅ | ✅ |
| Point of Sale | ✅ | ✅ | ✅ |
| Kitchen Display | ✅ | ✅ | ✅ |
| Sales History | ✅ | ✅ | ✅ |
| Inventory | ✅ | ✅ | ❌ |
| Products | ✅ | ✅ | ❌ |
| Accounting | ✅ | ✅ | ❌ |
| Reports | ✅ | ✅ | ❌ |
| Staff Management | ✅ | ❌ | ❌ |
| Audit Log | ✅ | ❌ | ❌ |

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Backend API running ([setup instructions](https://github.com/jaysonFullStackDev/BrewPOS-Backend))

### Install & Run

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

```bash
npm run dev
# → http://localhost:3000
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@brewpos.com | Admin@123 |
| Manager | manager@brewpos.com | Manager@123 |
| Cashier | cashier@brewpos.com | Cashier@123 |

Or sign up with **Google** to create your own shop.

---

## 🧪 Testing & CI/CD

### Backend Pipeline
```
Push → ESLint → Jest (21 tests) → Deploy to Render
```

Tests cover:
- **Integration** — Health endpoint, 404 handler
- **Unit** — Input validation rules (login, sales, expenses)
- **Unit** — Security middleware (XSS sanitization, account lockout)

### Frontend Pipeline
```
Push → TypeScript Build → Deploy to Vercel
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── login/          - Email/password + Google OAuth
│   ├── setup/          - Tenant setup wizard
│   ├── dashboard/      - Charts + staff management
│   ├── pos/            - POS screen + sales history
│   ├── kitchen/        - Real-time kitchen display
│   ├── inventory/      - Ingredients + products + suppliers
│   ├── accounting/     - Expenses + P&L
│   ├── reports/        - Analytics
│   └── audit/          - Audit log viewer
├── components/layout/  - Sidebar + AppShell (auth guard)
├── store/              - Auth + Cart context
├── lib/                - API client + utilities
└── types/              - TypeScript interfaces
```

---

## 🌐 Deployment

**Frontend** → [Vercel](https://vercel.com) (free tier)
**Backend** → [Render](https://render.com) (free tier)
**Database** → [Supabase](https://supabase.com) (free tier)

Set these environment variables:
- `NEXT_PUBLIC_API_URL` → Backend URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → Google OAuth client ID

---

## 📄 License

MIT

---

Built with ☕ by [Jayson](https://github.com/jaysonFullStackDev)

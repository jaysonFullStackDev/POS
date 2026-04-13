# ☕ BrewPOS — Coffee Shop POS System

A multi-tenant coffee shop POS system with real-time orders, automatic inventory deduction, expense tracking, and P&L reporting. Features Google OAuth signup, role-based access, and support for GCash, Maya, GoTyme, and bank transfers.

> **This repo contains the frontend only.** The backend API lives at [BrewPOS-Backend](https://github.com/jaysonFullStackDev/BrewPOS-Backend).

---

## 🏗️ Architecture

| Repo | Stack | Deploy |
|------|-------|--------|
| **[POS](https://github.com/jaysonFullStackDev/POS)** (this repo) | Next.js 14 · TypeScript · Tailwind CSS | Vercel |
| **[BrewPOS-Backend](https://github.com/jaysonFullStackDev/BrewPOS-Backend)** | Express.js · Node.js · PostgreSQL | Vercel / Railway |

```
frontend/
├── app/
│   ├── layout.tsx              - Root layout + global providers
│   ├── globals.css             - Tailwind + custom design tokens
│   ├── page.tsx                - Root redirect
│   ├── login/page.tsx          - Login (email/password + Google OAuth)
│   ├── setup/page.tsx          - Tenant setup wizard
│   ├── dashboard/page.tsx      - Dashboard with charts
│   ├── dashboard/users/page.tsx - Staff management
│   ├── pos/page.tsx            - Point of Sale cashier screen
│   ├── pos/history/page.tsx    - Sales history
│   ├── kitchen/page.tsx        - Kitchen display system
│   ├── inventory/page.tsx      - Inventory + suppliers
│   ├── inventory/products/page.tsx - Product catalog
│   ├── accounting/page.tsx     - Expenses & P&L
│   ├── reports/page.tsx        - Analytics & reports
│   └── audit/page.tsx          - Audit log viewer
├── components/layout/
│   ├── Sidebar.tsx             - Navigation + low stock badge
│   └── AppShell.tsx            - Auth guard + layout wrapper
├── store/
│   ├── AuthContext.tsx          - Auth state (Google + email login)
│   └── CartContext.tsx          - POS cart state
├── lib/
│   ├── api.ts                  - Typed API client with caching
│   └── safeRedirect.ts         - Redirect URL allowlist
└── types/
    └── index.ts                - All TypeScript interfaces
```

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** v18+
- **Backend API** running ([setup instructions](https://github.com/jaysonFullStackDev/BrewPOS-Backend))

### Install & Run

```bash
cd frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

```bash
npm run dev
# → App running on http://localhost:3000
```

---

### Demo Credentials

| Role     | Email                   | Password      |
|----------|-------------------------|---------------|
| Admin    | admin@brewpos.com       | Admin@123     |
| Manager  | manager@brewpos.com     | Manager@123   |
| Cashier  | cashier@brewpos.com     | Cashier@123   |

Or sign up with **Google** to create a new tenant.

---

## 🔐 Role Permissions

| Feature              | Admin | Manager | Cashier |
|----------------------|-------|---------|---------|
| Dashboard            | ✅    | ✅      | ✅      |
| Point of Sale (POS)  | ✅    | ✅      | ✅      |
| Kitchen Display      | ✅    | ✅      | ✅      |
| Sales History        | ✅    | ✅      | ✅      |
| Inventory            | ✅    | ✅      | ❌      |
| Products             | ✅    | ✅      | ❌      |
| Accounting           | ✅    | ✅      | ❌      |
| Reports              | ✅    | ✅      | ❌      |
| Staff Management     | ✅    | ❌      | ❌      |
| Audit Log            | ✅    | ❌      | ❌      |
| Delete Products      | ✅    | ❌      | ❌      |

---

## 📦 Tech Stack

| Layer      | Technology                                     |
|------------|------------------------------------------------|
| Framework  | Next.js 14 (App Router) · TypeScript           |
| Styling    | Tailwind CSS                                   |
| State      | React Context (Auth + Cart)                    |
| Charts     | Recharts                                       |
| Real-time  | Socket.IO Client                               |
| Auth       | Google Identity Services (OAuth)               |
| Caching    | Client-side response cache (30s TTL)           |

---

## 🔒 Security Features

- Redirect URL allowlist validation
- JWT access tokens (7-day expiry) with auto-refresh
- Refresh token rotation with reuse detection
- Google OAuth for admin signup
- Role-based route protection (AppShell)
- XSS-safe — no dangerouslySetInnerHTML

---

## 🌐 Deployment (Vercel)

```bash
cd frontend
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` → your backend URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → your Google OAuth client ID

---

## 💰 Key Features

- **Multi-tenant** — each company's data is fully isolated
- **Google OAuth signup** — shop owners sign up with Google, then create staff accounts
- **Tenant setup wizard** — company info + payment methods (GCash, Maya, GoTyme, Bank Transfer)
- **Real-time kitchen display** — orders appear instantly via WebSocket
- **Product preview cards** — click any product to see full details + recipe
- **Low stock notifications** — badge on sidebar + detailed alert panel
- **Category management** — create categories with custom colors
- **Scrollable receipts** — handles large orders gracefully

---

Built with ☕ for small coffee shop owners.

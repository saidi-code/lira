# Lira (ليرة) — Luxury Artisanal E-Commerce Platform

> Merging ancient Arabic calligraphic artistry and royal Middle Eastern craftsmanship with contemporary quiet luxury.

[![CI](https://github.com/saidi-code/lira/actions/workflows/ci.yml/badge.svg)](https://github.com/saidi-code/lira/actions/workflows/ci.yml)
[![Node Version](https://img.shields.io/badge/node-22.x-brightgreen.svg)](https://nodejs.org/)

---

## 1. Overview

**Lira (ليرة)** is a production-quality, full-stack luxury artisanal fashion and lifestyle e-commerce ecosystem. Tailored for Arabic-speaking markets with full RTL-first ergonomics, multi-language support (Arabic, French, English), and multi-currency operations (TND, EUR, USD, SAR).

The ecosystem connects customer-facing touchpoints and operational back-office interfaces to a unified Express REST API backed by MongoDB.

---

## 2. Brand Identity & Design System

The visual design system is anchored in tactile alabaster and cream canvas backdrops, warm charcoal and espresso typography (never harsh `#000000`), and restrained metallic gold accents:

- **Artisanal Gold (`#B89354`):** Primary CTAs, active indicators, borders, prices.
- **Canvas Background (`#FFF8F5` / `#FCF9F1`):** Handmade cotton paper feel.
- **Warm Charcoal (`#3C3633`):** High contrast, warm typography.
- **Editorial Typography:** Editorial serif titles (`Amiri`, `Noto Serif`, `Tajawal`) paired with clear modern sans for transactional data.
- **RTL-First:** Seamless right-to-left layout and mirrored navigation ergonomics.

---

## 3. Repository Architecture

The repository has separate clients for each role. Each app has its own routes and
navigation; the API remains the authority for which data each role can read or change.

| App | Role | Main features |
|---|---|---|
| `apps/mobile-user/` | `user` (guests may browse) | Storefront, cart, checkout, orders, profile |
| `apps/mobile-manager/` | `manager` | Inventory, purchasing, transfers |
| `apps/mobile-warehouse/` | `warehouse_staff` | Inventory visibility, transfers |
| `apps/desktop-cashier/` | `cashier` | Point of sale, receipts |
| `apps/web-admin/` | `admin` | Catalog and back-office management |
| `apps/web/` | Public | Storefront and checkout |

```text
lira_app/
├── apps/                    # Role-specific clients
│   ├── mobile-user/
│   ├── mobile-manager/
│   ├── mobile-warehouse/
│   ├── desktop-cashier/
│   ├── web-admin/
│   └── web/
├── packages/                # Shared types, permissions, tokens, and config
├── server/                  # Express API, MongoDB models, services, and tests
├── AGENT.md                 # Development and agent guidance
├── README.md
├── CONTRIBUTING.md
└── CHANGELOG.md
```

App entry gates route accounts to their assigned client. These gates only shape
the user experience: every private API route must still authenticate the request
and enforce role authorization on the server.

---

## 4. Key Subsystems

### 4.1 Event-Sourced Inventory Ledger
- **Golden Rule:** Stock is never mutated directly. Every change is an immutable `StockMovement` entry (`in`, `reserve`, `release`, `commit`, `transfer_in`, `transfer_out`, `adjust`).
- **Atomic Operations:** Concurrency-safe reservations and commits prevent overselling under concurrent load.
- **Reconciliation:** Built-in verification (`npm run reconcile`) detects drift between ledger totals and denormalized catalog stock.

### 4.2 Replay Protection & Server-Authoritative Pricing
- **Idempotency Keys:** `POST /api/v1/orders` requires unique customer-scoped idempotency keys to prevent duplicate orders or multiple charges on network retries.
- **Server Pricing:** Shipping costs, discounts, and taxes are strictly recalculated on the server from MongoDB; client-submitted price totals are disregarded.

### 4.3 Payment Lifecycle & Sweeps
- **Automated Expiry Sweep:** `/api/v1/internal/orders/release-expired` automatically cancels expired pending online orders and releases reserved stock.
- **Cron Authentication:** Compatible with Vercel Cron via `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`.

### 4.4 Webhook Synchronization
- **Clerk Auth Sync:** Verifies raw webhook signatures using `standardwebhooks` to ensure secure user profile and metadata synchronization.

---

## 5. Getting Started

### Prerequisites
- Node.js 22+
- npm 10+
- MongoDB instance (local or MongoDB Atlas)
- Clerk account for authentication keys

### 5.1 Server Setup

```bash
cd server
npm install

# Copy and configure environment variables
cp .env.example .env # or edit .env directly

# Seed catalog and default warehouse
npm run seed
npm run seed:warehouses

# Start development server
npm run server # starts with nodemon + tsx on port 5000
```

### 5.2 Mobile Client Setup

```bash
cd client
npm install

# Generate route types
npm run types:routes

# Start Expo dev server
npm run start
```

### 5.3 Web Backoffice & Storefront Setup

```bash
cd admin
npm install

cp .env.example .env # or edit .env directly: VITE_API_URL + VITE_CLERK_PUBLISHABLE_KEY

npm run dev # Vite dev server
```

```bash
cd web
npm install

cp .env.example .env # or edit .env directly: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is
                       # required even for `npm run build`, whose prerender fails without it

npm run dev # Next.js dev server on :3001
```

### 5.4 Shared Packages

`packages/shared` (`@lira/shared`) and `packages/config` (`@lira/config`) are
consumed by path, not published: `admin` and `web` depend on
`file:../packages/shared`. There is no workspace root, so each package keeps its
own lockfile and is installed independently. `packages/shared` keeps its
imports extensionless (`./types`, not `./types.js`) so both Vite and Next's
webpack resolve them; only add a `.js` suffix if `moduleResolution` ever moves
to `NodeNext`.

---

## 6. Verification & Testing

Both `client/` and `server/` enforce strict type safety, linting, and automated testing run by GitHub Actions CI:

### Server Checks
```bash
cd server
npm test                 # Run fast, database-free unit tests (259 tests)
npm run test:integration # Run full ledger & webhook integration tests against in-memory mongod (118 tests)
npx tsc --noEmit         # Typecheck TypeScript files
npm run lint             # ESLint analysis
```

### Client Checks
```bash
cd client
npm test                 # Run permission & admin guard unit tests (62 tests)
npm run types:routes     # Generate route type definitions
npx tsc --noEmit         # Typecheck with generated route definitions
npx eslint .             # ESLint analysis
```

### Web Backoffice & Storefront Checks
```bash
cd admin
npm run typecheck        # tsc --noEmit
npm run build            # tsc --noEmit && vite build

cd web
npm run typecheck        # tsc --noEmit
npm run lint             # next lint (requires the .eslintrc.json in this directory;
                         # without it `next lint` prompts and a non-interactive run hangs)
npm run build            # next build (also requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
```

---

## 7. Migration Scripts

The server provides dry-run and migration scripts for database maintenance:

| Command | Description |
|---|---|
| `npm run seed:warehouses` | Seeds the default warehouse and initial inventory records |
| `npm run reconcile` | Compares `Σ(quantity - reserved)` with catalog stock (`--fix` to sync) |
| `npm run backfill:deltas` | Computes signed `delta` fields for historical stock movements |
| `npm run repair:reservations` | Clears stranded holds from previously uncommitted orders |
| `npm run indexes:products` | Ensures optimal indexes on the `Product` collection |
| `npm run verify:clerk-sync` | Validates recent Clerk user webhook synchronization events |

---

## 8. License

No license file is currently tracked in this repository. Only `server/package.json`
declares a license (`ISC`); the other packages do not. Pick a license and add a
top-level `LICENSE` file before any public release, and mirror it in each
`package.json`.

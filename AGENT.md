# Lira (ليرة) — Complete Agent Context

> Single source of truth for AI agents and developers working on the **Lira (ليرة)** luxury artisanal e-commerce ecosystem.
> Includes: brand identity, design system, architecture, all clients, API, database, inventory domain, auth, jobs, deployment, and troubleshooting.

---

## 1. You Are Here

You are an expert **React Native + Expo / Node.js + Express** engineer helping build and maintain **Lira (ليرة)**, a production-quality luxury artisanal fashion e-commerce platform.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction.

---

## 2. Brand Philosophy & Identity

Lira merges ancient Arabic calligraphic artistry and royal Middle Eastern craftsmanship with contemporary quiet luxury. The brand communicates **heritage, bespoke curation, serenity, and tactile exclusivity**.

- **Brand Essence:** Bespoke · Artisanal · Timeless · Serene · Architectural
- **Brand Archetype:** High-End Editorial Boutique (Perfumes, Silks, Fine Leathers, Ceramics, Rare Jewelry)
- **Primary Mark:** Bespoke gold calligraphic wordmark "ليرة" with fluid ascenders, organic ligatures, and polished metallic sheen
- **Voice:** Quiet, confident, poetic. Never loud or salesy. Arabic-first, multilingual.

---

## 3. Design System

The Lira design system is the **visual contract** for every screen across Mobile, Admin, and Storefront.

### 3.1 Color Palette & Tokens

The palette is anchored in **warm metallic gold**, **tactile alabaster/cream** backgrounds, **crisp card surfaces**, and **warm charcoal/espresso** typography (never harsh pure black).

#### Core Palette

| Role | Token | Hex | Tailwind | Usage |
|---|---|---|---|---|
| **Primary (Artisanal Gold)** | `colors.primary` | `#B89354` | `text-[#B89354]`, `bg-[#B89354]` | Primary CTA buttons, active tabs, gold borders, key accents, focus rings |
| **Primary Fixed / Vivid** | `colors.primary-fixed` | `#D4AF37` | `text-[#D4AF37]` | Radiant metallic highlights, star badges, luxury crest accents |
| **Primary Deep / Bronze** | `colors.primary-dim` | `#785920` | `text-[#785920]` | Pressed states, high-contrast headings on cream backdrops |
| **Canvas Background** | `colors.surface` | `#FFF8F5` / `#FCF9F1` | `bg-[#FFF8F5]` | Main screen background — handmade cotton paper feel |
| **Surface Dim / Warm Tint** | `colors.surface-dim` | `#FDF1EA` | `bg-[#FDF1EA]` | Secondary backgrounds, badge containers, active pill fills |
| **Surface Lowest / Cards** | `colors.surface-lowest` | `#FFFFFF` | `bg-white` | Elevated product cards, modals, checkout step containers |
| **Text Primary (Charcoal)** | `colors.on-surface` | `#3C3633` | `text-[#3C3633]` | Headings, body, order numbers, high contrast |
| **Text Muted / Secondary** | `colors.on-surface-variant` | `#78716C` | `text-stone-500` | Subtitles, helper text, timestamps, inactive nav |
| **Dividers & Subtle Borders** | `colors.outline` | `rgba(184,147,84,0.15)` | `border-[#B89354]/15` | Hairline separators, subtle card strokes |
| **Accent / State / Alert** | `colors.tertiary` | `#8B4513` / `#A3523B` | `text-amber-800` | Warning, limited stock ("Only 2 left"), error hints |

#### Dark Mode — "Luxury Night / Velvet"

| Role | Hex | Tailwind |
|---|---|---|
| **Dark Background** | `#1C1917` (Stone 900) | `dark:bg-stone-900` |
| **Dark Surface (Cards)** | `#292524` (Stone 800) | `dark:bg-stone-800` |
| **Dark Text** | `#FAF7F2` | `dark:text-stone-100` |
| **Dark Gold Accent** | `#D4AF37` | `dark:text-[#D4AF37]` |

#### Color Rules

- ✅ **Always use gold accents sparingly** — they are jewelry, not paint.
- ✅ **Use warm stone tones** (`#3C3633`, `#78716C`) — never pure black.
- ❌ **Never use `#000000`** for text or backgrounds.
- ❌ **Never use saturated primaries** (pure red, blue, green). Alerts use warm terracotta `#A3523B`.

---

### 3.2 Typography & Hierarchy

Lira balances **editorial serif elegance** with **crystal-clear sans-serif legibility** for transactional data (prices, numbers, SKUs).

#### Type Families

- **Editorial & Display (Headlines):** `Noto Serif`, `Tajawal`, or `Amiri` — `font-serif`, tracking-wide / tracking-tight for Arabic titles
- **Body & Data (Numbers, Prices, Forms):** Clean Modern Arabic Sans / System Sans — `font-sans`, tracking-normal
- **Loaded in mobile root layout:**
  - `jazera-bold` → Al-Jazeera-Arabic-Bold
  - `tajwal-medium` → Tajawal-Medium
  - `arabic-body` → IBMPlexSansArabic-Regular

#### Type Scale

| Role | Font / Weight | Size | Mobile Sizing | Usage |
|---|---|---|---|---|
| **Display Hero** | Serif / Light–Medium | 32–40px | `text-3xl font-serif` | Splash, editorial heroes |
| **Headline 1** | Serif / Semibold | 24–28px | `text-2xl font-serif font-bold` | Screen titles ("تفاصيل الطلب", "حقيبة التسوق") |
| **Headline 2** | Serif / Medium | 18–20px | `text-xl font-serif` | Section titles, product card titles |
| **Body Standard** | Sans / Regular | 15–16px | `text-base` | Product descriptions, address cards, notes |
| **Body Small** | Sans / Regular | 13–14px | `text-sm text-stone-500` | Metadata, date, courier info, helper text |
| **Label / Badge** | Sans or Serif / Bold | 10–12px | `text-xs uppercase tracking-widest` | Category chips, status badges, tab labels |
| **Price / Currency** | Sans / Bold | 18–24px | `text-lg font-bold text-[#B89354]` | Price display (`١,٢٥٠ ر.س` / `1,250 SAR`) |

---

### 3.3 Spacing, Elevation & Geometry

#### Radii (Corner Smoothness)

Reflecting the smooth, calligraphic flow of the logo:

- **Buttons & Small Badges:** `8px`–`12px` → `rounded-lg` / `rounded-xl`
- **Product & Content Cards:** `16px`–`20px` → `rounded-2xl`
- **Bottom Sheets & Modals:** `28px`–`32px` → `rounded-t-[32px]`
- **Pills / Status Chips / Avatars:** `9999px` → `rounded-full`

#### Elevation & Shadows

Subtle **ambient luxury glow** using a transparent gold tint rather than muddy grey shadows:

- **Card Shadow:** `shadow-[0_4px_20px_rgba(184,147,84,0.08)]`
- **Elevated Floating Bar / Nav:** `shadow-[0_-4px_20px_rgba(184,147,84,0.08)]`
- **Dropdown / Modal Glow:** `shadow-[0_12px_40px_rgba(184,147,84,0.14)]`

#### Spacing Rhythm

- Base unit: **4px**
- Vertical rhythm: `space-y-3` (12px), `space-y-4` (16px), `space-y-6` (24px)
- Screen padding: `px-5` (20px) on mobile, `px-8` (32px) on web
- Section gaps: `gap-6` (24px) between major blocks

---

### 3.4 UI Component Specs & Patterns

#### Primary Button (Artisanal Gold)

```html
<button class="w-full bg-[#B89354] hover:bg-[#A58245] active:scale-[0.98] text-white py-4 px-6 rounded-xl font-medium shadow-md shadow-[#B89354]/20 transition-all flex items-center justify-center gap-2">
  <span>إتمام الطلب</span>
</button>
```

#### Secondary / Outlined Button

```html
<button class="w-full border border-[#B89354]/40 bg-white/60 hover:bg-[#B89354]/5 active:scale-[0.98] text-[#B89354] py-3.5 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
  <span>عرض الفاتورة</span>
</button>
```

#### Product Card (Curated Grid)

- **Background:** Pure white (`#FFFFFF`) with subtle border `border border-[#B89354]/10`
- **Image Aspect:** 1:1 or 4:5 portrait, smooth corners (`rounded-xl`), `object-cover`
- **Wishlist Toggle:** Floating round button top-left/top-right (`bg-white/80 backdrop-blur-md rounded-full p-2`)
- **Typography:** Title in serif medium, price in bold gold `#B89354`
- **Hover (web):** Subtle lift (`translate-y-[-2px]`) + shadow intensify

#### Order & Shipping Stepper (Tracking Timeline)

**4 Standard Milestones:**
1. `تم استلام الطلب` — Order Placed
2. `قيد التجهيز` — Processing / In Atelier
3. `تم الشحن` — Dispatched / Shipped
4. `تم التوصيل` — Delivered

**Node states:**
- **Completed:** Circular icon filled gold `#B89354` with checkmark
- **Active:** Pulsing gold ring around courier truck icon
- **Inactive:** Soft cream `#FDF1EA` with muted outline

#### App Header & Bottom Navigation

- **Top App Bar:** Centered calligraphic logo (or title), leading back/menu action, trailing bag/search action. Glassmorphic blur: `bg-[#FFF8F5]/85 backdrop-blur-md`
- **Bottom Navigation Bar (4 core destinations):**
  1. **Atelier / الرئيسية** — Storefront / Home
  2. **Catalog / الكتالوج** — Search / Categories
  3. **Bag / حقيبة التسوق** — Shopping Cart (with badge counter)
  4. **Profile / حسابي** — User / Guest account

#### Status Badges / Chips

```html
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#FDF1EA] text-[#785920] border border-[#B89354]/20">
  قيد التجهيز
</span>
```

#### Input Fields

```html
<input class="w-full bg-white border border-[#B89354]/20 focus:border-[#B89354] focus:ring-2 focus:ring-[#B89354]/20 rounded-xl px-4 py-3 text-[#3C3633] placeholder:text-stone-400 transition-all" />
```

- **Error state:** `border-[#A3523B]` + helper text beneath in `#A3523B` (italic, small)

---

### 3.5 Motion & Micro-interactions

- **Durations:** 150ms (micro), 250ms (standard), 400ms (editorial reveals)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` for standard, `cubic-bezier(0.34, 1.56, 0.64, 1)` for celebratory (add-to-bag)
- **Haptics (Mobile):**
  - Color/size chips: `Haptics.impactAsync(Light)`
  - Add to Bag & Order Placement: `Haptics.notificationAsync(Success)`
- **Page transitions:** Fade + subtle upward drift (8px)
- **Loading:** Gold-tinted skeleton shimmer (`bg-gradient-to-r from-[#FDF1EA] via-[#FFF8F5] to-[#FDF1EA]`)

---

### 3.6 Design Guardrails for AI Agents

1. **RTL & Arabic Script First**
   - Always set `dir="rtl"` when generating Arabic UI
   - Mirror back arrows (`arrow_forward` for RTL back action)
   - Align text naturally per script

2. **Strict Currency Representation**
   - Saudi Riyal: `ر.س` (Arabic) or `SAR` (English) → `١,٢٥٠ ر.س` or `1,250 SAR`
   - Never hardcode currency symbols — use `usePrice()` (mobile) or `formatPrice()` (admin)

3. **No Pure Black Elements**
   - Avoid `#000000` in text, borders, shadows, or backgrounds
   - Use `#3C3633` / `#1C1917` for text; `rgba(184,147,84,0.15)` for borders

4. **Haptic & Sensory Feedback (Mobile)**
   - Every primary touch target should reinforce with haptics
   - Success flows (order placed) use `notificationAsync(Success)`

5. **Form Validation States**
   - Error borders: `#A3523B` (warm coral/terracotta — never neon red)
   - Helper errors: small italicized caption beneath inputs

6. **Gold is Jewelry, Not Paint**
   - Accent use only: CTAs, borders, active states, prices
   - Never full-bleed gold backgrounds

7. **Consistency Across Clients**
   - Mobile, Admin, and Storefront share tokens via `@lira/shared`
   - Admin stays LTR layout; Mobile + Storefront honor RTL

---

## 4. Project Overview

Lira is a **full-stack, multi-client e-commerce platform** for luxury fashion and artisanal goods targeting Arabic-speaking markets, with multi-language (AR/FR/EN) and multi-currency (TND/EUR/USD/SAR) support.

Three clients on one Express API:

| # | Client | Path | Stack | Purpose |
|---|---|---|---|---|
| 1 | **Mobile app** | `client/` | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 | Customer storefront (iOS/Android) |
| 2 | **Admin / Back Office** | `admin/` | React 18 + Vite + TS + shadcn/ui + TanStack Query/Table | Inventory, orders, catalog, reports |
| 3 | **Storefront web** | `web/` | Next.js 14 (App Router) | Public SEO shop *(planned)* |

All clients consume REST at `/api/v1` and share types via `@lira/shared`.

| Layer | Stack |
|---|---|
| Mobile Client | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 |
| Admin Web | React 18, Vite, TanStack Query/Table, shadcn/ui, Recharts |
| Storefront Web | Next.js 14 (App Router), Tailwind, TanStack Query |
| Authentication | Clerk (`@clerk/clerk-expo`, `@clerk/clerk-react`, `@clerk/express`) |
| Server | Node.js, Express v5, TypeScript, `tsx` |
| Database | MongoDB via Mongoose v9 |
| Cache / Queues | Redis + BullMQ |
| File Storage | Cloudinary |
| Email | Nodemailer |
| HTTP Client | Axios + TanStack React Query v4 |
| Deployment | Server on Vercel/Railway, Admin + Web on Vercel, Mobile via EAS |

---

## 5. Repository Structure

```
lira_app/
├── AGENT.md                 # This file
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── client/                  # Expo React Native app (customer)
│   ├── app/                 # Expo Router routes
│   │   ├── _layout.tsx      # Providers
│   │   ├── (auth)/
│   │   ├── (drawer)/
│   │   │   └── (tabs)/      # index, shop, cart, wishlist, profile
│   │   ├── product/         # Detail
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── address/
│   │   ├── payment-methods/
│   │   ├── reviews/
│   │   ├── profile/
│   │   ├── settings/
│   │   └── admin/           # Legacy (prefer web admin)
│   ├── components/
│   ├── config/              # API layer
│   ├── constants/           # theme store, colors, translations
│   ├── context/             # SettingsContext
│   ├── hooks/
│   └── assets/              # Fonts, images
│
├── admin/                   # Back Office web
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── layouts/         # AdminLayout
│   │   ├── pages/           # Dashboard, products, inventory, orders, ...
│   │   ├── components/      # DataTable, PageHeader, ...
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── styles/
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── web/                     # Storefront (Next.js) — planned
│
├── packages/
│   ├── shared/              # @lira/shared — types, schemas, constants, tokens
│   └── config/              # tsconfig, eslint
│
└── server/                  # Express API
    ├── server.ts
    ├── config/              # DB, Redis, Cloudinary
    ├── controllers/
    ├── routes/              # Mounted at /api/v1
    ├── middlewares/         # auth.ts, upload.ts
    ├── models/
    ├── services/
    ├── jobs/                # BullMQ workers
    ├── seeds/
    ├── templates/
    └── utils/
```

---

## 6. Architecture

### High-level Diagram

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Mobile      │  │  Admin Web   │  │  Storefront  │
│  (Expo)      │  │  (Vite)      │  │  (Next.js)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────┬────────┴────────┬────────┘
                │  HTTPS / REST   │
         ┌──────▼─────────────────▼──────┐
         │   Express API (/api/v1)       │
         │   Clerk auth + RBAC           │
         └──────┬────────┬────────┬──────┘
                │        │        │
         ┌──────▼──┐ ┌───▼────┐ ┌─▼──────────┐
         │ MongoDB │ │ Redis  │ │ Cloudinary │
         └─────────┘ └────────┘ └────────────┘
```

### Principles

1. **One API, many clients.** No business logic duplicated in clients.
2. **Shared types via `@lira/shared`.** Never redefine `Product`, `Order`, etc.
3. **Hooks own server state.** React Query lives in `hooks/` or `api/`.
4. **Inventory is event-sourced.** Every change = a `StockMovement`.
5. **Design tokens are shared.** Mobile, Admin, Storefront use the same palette via `@lira/shared/tokens`.
6. **RTL-first UI.** Every layout checks `isRTL` from settings.

### Layers

| Layer | Responsibility | Location |
|---|---|---|
| Routes | URL → controller | `server/routes/` |
| Middleware | Auth, uploads, errors | `server/middlewares/` |
| Controllers | Request → service → response | `server/controllers/` |
| Services | Business logic, transactions | `server/services/` |
| Models | Mongoose schemas, indexes | `server/models/` |
| Jobs | Async work via BullMQ | `server/jobs/` |
| Shared | Types, schemas, tokens | `packages/shared/` |

---

## 7. Mobile Client (`client/`)

### Routing (Expo Router v6)

- File-system routing; groups use `(groupName)`
- Root layout: `QueryClientProvider → ClerkProvider → SettingsProvider → GestureHandlerRootView → Stack`
- `AuthModalContainer` driven by `useAuthModal()` from `useCart.ts`
- Toasts via `react-native-toast-message` with custom `toastConfig`

### State Management

- **Server state:** TanStack React Query v4 — `staleTime: 2 min`, `cacheTime: 15 min`, `retry: 1`, `refetchOnWindowFocus: false`
- **App settings:** `SettingsContext` persisted to AsyncStorage at `@lira/settings/v1`
- **Auth state:** Clerk SDK

### API Layer (`client/config/`)

- `api.ts` — Base `apiClient` (axios). Base URL from `EXPO_PUBLIC_API_URL`, falling back to Vercel URL
- Per-resource: `productApi.ts`, `cartApi.ts`, `orderApi.ts`, `addressApi.ts`, `favorisApi.ts`, `reviewApi.ts`, `collectionApi.ts`
- Auth tokens injected per-request via `Authorization` header

### Styling

- **NativeWind v4** (Tailwind for RN)
- Design tokens imported from `@lira/shared/tokens` → mapped in `tailwind.config.js`
- Fonts loaded in root layout (see §3.2)

### Settings (`SettingsContext`)

| Setting | Options | Default |
|---|---|---|
| language | `ar`, `fr`, `en` | `ar` |
| currency | `TND`, `EUR`, `USD`, `SAR` | `TND` |
| theme | `light`, `dark`, `system` | `light` |
| phoneNotifications | boolean | `false` |
| emailNotifications | boolean | `false` |

- `isRTL` derived from language
- Theme synced via `setColorScheme()` + `themeStore` singleton

### Hooks (`client/hooks/`)

| Hook | Purpose |
|---|---|
| `useCart` | Cart CRUD + `useAuthModal` |
| `useOrder` | Order creation, listing, tracking |
| `useAddress` | Address CRUD |
| `useFavoris` | Wishlist |
| `useProducts` | Product listing with filters |
| `useCollections` | Collections |
| `useCategories` | Categories |
| `useReviews` | Reviews |
| `useDebouncedSearch` | Debounced search |
| `usePrice` | Currency-aware price formatting |
| `useTranslation` | UI strings |

> ⚠️ `useProdoucts.ts` is an empty stub — always import from `useProducts.ts`.

### Adding a New Screen

1. Create file under `app/`
2. Add hook in `hooks/useYourThing.ts` (React Query)
3. Add API fn in `config/yourThingApi.ts`
4. Use `CachedImage` for remote images
5. Apply design tokens from §3
6. Test in both `light`/`dark` and `ar`/`en`

---

## 8. Admin Web (`admin/`)

### Tech

- React 18 + Vite + TS
- `react-router-dom` v6
- TanStack Query v4 + Table v8
- `react-hook-form` + `zod` resolvers (schemas from `@lira/shared`)
- shadcn/ui + Tailwind
- Recharts
- Clerk (`@clerk/clerk-react`)
- `<RequireRole roles={[...]}>` route guards

### Structure

```
src/
├── main.tsx              # Providers: Clerk, QueryClient, Router
├── App.tsx               # Routes
├── layouts/AdminLayout   # Sidebar + topbar
├── pages/                # One folder per domain
├── components/           # DataTable, PageHeader, ConfirmDialog, ...
├── api/                  # axios + per-resource functions
├── hooks/                # React Query hooks
└── lib/                  # formatters, cn(), ...
```

### Feature Map

| Area | Screens | Notes |
|---|---|---|
| Dashboard | KPIs, low-stock widget, revenue chart | Refetch every 60s |
| Products | List, Create/Edit (variants), Bulk import (CSV) | `type: simple\|variable` |
| Categories | Nested tree CRUD | Drag-to-reorder |
| Collections | Featured/promotional groups | |
| Inventory | Stock grid per product × warehouse | All changes → `StockMovement` |
| Warehouses | CRUD for locations | |
| Suppliers | Contact + product links | |
| Purchase Orders | Draft → Sent → Received → Closed | Receiving → stock movements |
| Orders | List, Detail, Status flow, Invoice PDF | |
| Customers | List, Detail, order history | |
| Reviews | Moderation | |
| Reports | Sales, valuation, movements | Export CSV |
| Users | Invite, roles, disable | |
| Settings | Store config, shipping, tax | |

### Conventions

- `<DataTable>` for lists (sorting, pagination, filters)
- Forms: `react-hook-form` + `zodResolver` with `@lira/shared` schemas
- Every mutation invalidates matching query key
- Toasts via `sonner`
- **Admin stays LTR** (Arabic labels OK; layout stays LTR)
- Design tokens applied per §3

### Required Roles per Page

| Page | Roles |
|---|---|
| Dashboard | `admin,manager` |
| Products | `admin,manager` |
| Inventory | `admin,manager,warehouse_staff` |
| Suppliers | `admin,manager` |
| Purchase Orders | `admin,manager,warehouse_staff` (receive only) |
| Orders | `admin,manager,cashier` |
| Reports | `admin,manager` |
| Users | `admin` |

---

## 9. Inventory Domain (Core)

**Golden rule: never mutate stock directly.** Every change is a `StockMovement`.

### Movement Types

| Type | Trigger | `quantity` | `reserved` |
|---|---|---|---|
| `in` | PO receive, restock | `+qty` | – |
| `out` | Order fulfilled | `-qty` | `-qty` |
| `reserve` | Order placed (unpaid) | – | `+qty` |
| `release` | Cancel / reservation expired | – | `-qty` |
| `transfer` | Inter-warehouse | `-qty` from, `+qty` to | – |
| `adjust` | Manual correction | `+/-qty` | – |

### Available Stock

```ts
available = inventory.quantity - inventory.reserved
```

Low-stock alert when `available <= inventory.reorderLevel`.

### Service API (`server/services/inventoryService.ts`)

```ts
reserve(items, session)          // order placement
release(items, session)          // order cancel
commit(items, session)           // order fulfilled
receive(items, warehouse, po)    // PO receive
transfer(from, to, items)        // inter-warehouse
adjust(product, warehouse, delta, reason, user)
getAvailable(productId, warehouseId)
getLowStock(warehouseId?)
```

### Concurrency (Atomic Deduction)

```ts
const updated = await Inventory.findOneAndUpdate(
  { product, warehouse, quantity: { $gte: qty } },
  { $inc: { quantity: -qty } },
  { new: true, session }
);
if (!updated) throw new ConflictError('Insufficient stock');
```

Multi-item orders wrap in one session/transaction.

> **Status:** the `Inventory` / `StockMovement` model described above does not
> exist yet, so checkout today applies this exact pattern straight to
> `Product.stock` — `deductStock()` / `restoreStock()` in
> `server/controllers/OrderController.ts`, wrapped by
> `server/utils/transaction.ts` (`withOptionalTransaction` runs a real
> transaction on a replica set and falls back to compensating writes on a
> standalone dev `mongod`). Migrate to `inventoryService` when it lands.

### Reconciliation

Nightly 03:00 (`jobs/reconcileStock`):
1. Sum `Inventory.quantity` per product
2. Compare to `Product.stock`
3. Log drift → correct → alert `ADMIN_ALERT_EMAIL`

### Adding a Movement Type

1. Add to enum in `packages/shared/src/constants/movementTypes.ts`
2. Handle in `inventoryService.applyMovement()`
3. Add to admin filters
4. Add tests

---

## 10. Server (`server/`)

### Entry Point

- Clerk webhook **before** `express.json()` (raw body)
- Order: `cors()` → `express.json()` → `clerkMiddleware()` → routes
- Routes mounted at `/api/v1`
- Redis + BullMQ bootstrapped after DB connect

### Routes

| Route | Resource | Auth |
|---|---|---|
| `/products` | CRUD, filtering, search | public read, `protect` write |
| `/cart` | Cart | `protect` |
| `/wishlist` | Wishlist | `protect` |
| `/collections` | Collections | public read, `protect` write |
| `/categories` | Categories | public read, `protect` write |
| `/addresses` | Addresses | `protect` |
| `/orders` | Orders | `protect` (own) / `authorize('admin')` |
| `/pricing` | Shipping fee + tax rate (display only) | public |
| `/reviews` | Reviews | public read, `protect` write |
| `/inventory` | Stock levels | `authorize('admin','manager','warehouse_staff')` |
| `/warehouses` | Warehouses | `authorize('admin','manager')` |
| `/suppliers` | Suppliers | `authorize('admin','manager')` |
| `/purchase-orders` | PO workflow | `authorize('admin','manager')` |
| `/transfers` | Transfers | `authorize('admin','manager','warehouse_staff')` |
| `/reports` | Reports | `authorize('admin','manager')` |
| `/clerk` | Webhook | signature-verified |

### Auth Middleware

- `protect` — verifies Clerk session, loads `User` by `clerkId`, attaches `req.user`
- `authorize(...roles)` — checks `req.user.role`

### Roles

| Role | Scope |
|---|---|
| `admin` | Full access |
| `manager` | Everything except user role changes |
| `warehouse_staff` | Inventory ops, transfers, receiving |
| `cashier` | Order processing |
| `customer` | Mobile default |

---

## 11. Data Models

| Model | Key Fields |
|---|---|
| `Product` | name, type (`simple`/`variable`), sku, price, **cost**, **stock (denorm)**, category, subCategory, colors, sizes, images, isFeatured, isActive, **supplier** |
| `Order` | user, orderNumber, items[], shippingAddress, paymentMethod, paymentStatus, orderStatus, subtotal, shippingCost, tax, totalAmount, **stockReserved** |
| `Cart` | user, items[] |
| `Address` | user, type, street, city, state, zipCode, phoneNumber |
| `User` | clerkId, role |
| `Category` | name, parent |
| `Collections` | name, products[] |
| `Review` | product, user, rating, comment, **status** |
| `WishList` | user, products[] |
| `Varianats` | (typo filename) size, color refs |
| `Colors` | hex, name |
| `Warehouse` | name, code, address, isActive, isDefault |
| `Inventory` | product, warehouse, quantity, reserved, reorderLevel, binLocation |
| `StockMovement` | product, warehouse, type, quantity, reference, user, note, createdAt |
| `Supplier` | name, contact, email, phone, address, products[] |
| `PurchaseOrder` | supplier, status, items[], totals, expectedAt, receivedAt |
| `PurchaseOrderItem` | product, quantity, unitCost, receivedQty |
| `Transfer` | fromWarehouse, toWarehouse, status, items[], createdBy |

### Key Indexes

```js
// products
{ isActive: 1, createdAt: -1 }
{ isActive: 1, price: 1 }
{ isActive: 1, brand: 1 }
{ 'colors.hex': 1 }
{ sizes: 1 }
{ category: 1, isActive: 1 }

// inventories
{ product: 1, warehouse: 1 }   // unique
{ warehouse: 1, quantity: 1 }

// stockmovements
{ product: 1, createdAt: -1 }
{ warehouse: 1, createdAt: -1 }
{ reference: 1 }

// orders
{ user: 1, createdAt: -1 }
{ orderNumber: 1 }  // unique
{ user: 1, idempotencyKey: 1 }  // unique, partial — checkout replay guard
```

### Invariants

1. `Inventory` unique on `(product, warehouse)`
2. Every quantity change → `StockMovement`
3. `Product.stock` = Σ `Inventory.quantity` (reconciled nightly)
4. `Inventory.reserved ≤ Inventory.quantity`
5. `PurchaseOrderItem.receivedQty ≤ PurchaseOrderItem.quantity`

### Order Number

`ORD-YYYYMMDD-<6 random alphanumeric>` — `pre('save')` hook, collision retry (max 5), timestamp fallback

### Order Pricing

**Shipping and tax are never read from the request body.** `POST /orders`
recomputes `subtotal`, `shippingCost`, `tax` and `totalAmount` in
`server/config/pricing.ts` from the prices stored in MongoDB, so a crafted
client cannot post `shippingCost: 0` (or a negative number) and buy below cost.
Clients fetch the same numbers for display from `GET /pricing` and never send
them back.

| Env var | Default | Meaning |
|---|---|---|
| `SHIPPING_COST` | `7` | flat fee per order |
| `TAX_RATE` | `0` | fraction (`0.19` = 19 %) |
| `FREE_SHIPPING_THRESHOLD` | unset | subtotal at/above which shipping is waived |

Config lives server-side only (§6.1, "one API, many clients"). Covered by
`server/tests/pricing.test.ts` (`npm test`, §13).

### Cancelling & Restocking

Stock is deducted when an order is created, so ending an order has to give those
units back. Every entry point that can end an order routes through
`cancelAndRestock()` in `server/controllers/OrderController.ts`:

| Entry point | Behaviour |
|---|---|
| `PUT /orders/:id/cancel` (owner or admin) | guarded cancel + restock |
| `PUT /orders/:id/status` with `orderStatus: "cancelled"` | same helper — not a plain field write |
| `DELETE /orders/:id` (admin) | cancels, and therefore restocks, first when the order still holds units |

Rules the helper enforces:

- Only `placed`/`processing` orders are cancellable. The status filter on the
  update is the claim: the request that actually flips the status is the only one
  that restocks, so concurrent cancels cannot credit the same units twice.
- `shipped`/`delivered` orders sold their units — cancelling is refused (400).
- A cancelled order's **status** is final: the status route refuses to reopen it,
  because re-reserving stock is not that endpoint's job — the customer orders
  again. Sending `paymentStatus` alone on a cancelled order is still allowed, so
  a refund can be recorded.

**Never assign `order.orderStatus = "cancelled"` directly** — that is a plain
write, and it silently loses the stock checkout reserved.

That claim → restock pair is unit-tested with a faked store in
`server/tests/cancel.test.ts` (§13): double cancels, a restore that fails
halfway, and the no-transaction rollback are all covered without a database.

### Replay Protection

`POST /orders` honours an `Idempotency-Key` header. The key is stored on the order
behind a **unique `(user, idempotencyKey)` partial index**, so a double-tapped or
network-retried checkout returns the order that already exists instead of placing
a second one and deducting stock twice. It is scoped per customer — and every
lookup in the controller passes `user` along with the key — so two shoppers who
happen to generate the same key can never claim, or read, each other's order. The
client mints one key per checkout attempt (`newIdempotencyKey()`) and regenerates
it only after a success.

Keys live as long as the order does: they are 36 bytes, and expiring one would
reopen the replay window it exists to close. `connectDB()` calls `syncIndexes()`
on boot, so index changes here are applied by the next server start — including
dropping the older key-only index — without a manual migration.

### Transactions

```ts
const session = await mongoose.startSession();
await session.withTransaction(async () => {
  // reserve stock
  // create order
  // log movements
});
```

`server/utils/transaction.ts` wraps this as `withOptionalTransaction(work)`: it
opens the session, runs `work` under `withTransaction`, and re-runs `work`
without a session when the deployment refuses transactions (a standalone local
`mongod`, error code 20). Anything done inside `work` must therefore also be able
to undo itself — see `deductStock` / `restoreStock` / `cancelAndRestock`.

### Seeding

```bash
cd server
npm run seed              # products
npm run seed:warehouses   # default warehouse + inventory docs
```

---

## 12. API Reference

**Base URL:** `https://lira-lilac.vercel.app/api/v1`
**Auth:** `Authorization: Bearer <Clerk JWT>`

### Response Shape

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Not found" }
```

### Products

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/products` | public | `category`, `subCategory`, `minPrice`, `maxPrice`, `search`, `page`, `limit` |
| GET | `/products/:id` | public | |
| POST | `/products` | `admin,manager` | `ProductCreateSchema` |
| PUT | `/products/:id` | `admin,manager` | |
| DELETE | `/products/:id` | `admin` | Soft delete |

### Cart / Orders / Wishlist / Addresses / Reviews / Collections / Categories

Standard CRUD (see §10 for role requirements). `POST /orders` additionally
accepts an `Idempotency-Key` header and ignores any `shippingCost`/`tax` in the
body (see §11 Order Pricing).

### Pricing

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/pricing` | public | `shippingCost`, `taxRate`, `freeShippingThreshold` — for display; the server always recomputes the charged amounts |

### Inventory

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/inventory` | `admin,manager,warehouse_staff` | `warehouse`, `product`, `lowStock=true` |
| GET | `/inventory/:productId` | same | Per-warehouse |
| POST | `/inventory/adjust` | `admin,manager` | `{ productId, warehouseId, quantity, reason }` |
| GET | `/inventory/movements` | `admin,manager` | Paginated |

### Warehouses / Suppliers / Purchase Orders / Transfers / Reports

See §10 for routes and roles.

### Webhooks

| Method | Path | Notes |
|---|---|---|
| POST | `/clerk` | Signature-verified raw body |

---

## 13. Verification & CI

Nothing in this repo used to be enforced: type errors and failing logic reached
`production` unnoticed. These are the checks that exist, and `.github/workflows/ci.yml`
runs exactly them on every push to `production` and on every pull request.

| Where | Command | Covers |
|---|---|---|
| `server/` | `npx tsc --noEmit --pretty false` | types — `noUnusedLocals` is on, so dead imports fail the build |
| `server/` | `npm test` | `tests/pricing.test.ts` (the money math), `tests/cancel.test.ts` (stock coming back) |
| `client/` | `npx tsc --noEmit --pretty false` | types |
| `client/` | `npx expo lint` | ESLint (flat config) |

Keeping CI trustworthy:

- **No database, no secrets.** The server suite uses `node:test` with fakes —
  `runCancellation()` takes an injected `CancellationStore` — so it runs on a clean
  checkout without MongoDB, Redis or Clerk credentials and cannot flake on them.
  Anything that genuinely needs a live DB stays a manual smoke test, below.
- **Two independent workspaces.** `client/` and `server/` each carry their own
  `package.json` + lockfile and there is no root workspace, so CI `npm ci`s per
  directory (`cache-dependency-path` points at each lockfile).
- **`noUnusedParameters` stays off on purpose.** Express handlers must keep their
  `(req, res, next)` shape even when a parameter is unused; enabling it would mean
  renaming `req` to `_req` across every controller for no gain.
- Node 22 in CI matches the local toolchain.

### Still manual — needs a live MongoDB

CI cannot see these, so run them against a real database before shipping an
order-flow change:

1. Place an order → the stored `subtotal` / `shippingCost` / `tax` / `totalAmount`
   match the server calculation, not what the client held in state.
2. Double-tap checkout → one order, one stock deduction (`Idempotency-Key`).
3. Buy past a product's stock → `409`, and `Product.stock` is untouched.
4. Admin cancels a `placed` order → `Product.stock` comes back by the ordered qty.
5. Admin deletes a `placed` order → it is restocked first, then removed.

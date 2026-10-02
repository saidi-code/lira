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
| `reserve` | Order placed (unpaid) | – | `+qty` |
| `release` | Cancel / reservation expired | – | `-qty` |
| `commit` | **Order fulfilled** | `-qty` | `-qty` |
| `out` | Direct removal, nothing was held | `-qty` | – |
| `transfer_out` | Inter-warehouse, source side | `-qty` | – |
| `transfer_in` | Inter-warehouse, destination side | `+qty` | – |
| `adjust` | Manual correction | `+/-qty` | – |

Two distinctions the table used to get wrong, both of which caused real bugs:

- **`commit` is not `out`.** An `out` removes stock that was never held, so it
  leaves `reserved` alone. A `commit` settles a *hold*, so it must clear both.
  Folding them together meant every shipped order left a phantom reservation
  that permanently blocked those units from being sold again.
- **Transfers are two types, not one signed quantity.** `StockMovement.quantity`
  is a magnitude (`min: 0`), so a single `transfer` type could only express
  direction as a negative quantity — which the schema rejected outright.

Every row also stores a derived `delta` (the signed effect on `quantity`), and a
`pre("validate")` hook refuses to save a row whose `delta` contradicts its
`type`. A row that misstates its own effect is worse than no row: this table is
the fallback when `Inventory` is in doubt.

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

> **Status:** implemented end-to-end. Checkout goes through
> `services/orderStockService.ts`, which is the only place that writes stock:
>
> | Order event | Ledger | `Product.stock` |
> |---|---|---|
> | placed | `reserve` (hold) | `− n` |
> | cancelled / expired | `release` | `+ n` |
> | shipped | `commit` (units leave) | unchanged |
>
> Two things to know before touching it:
>
> - **Order is written before the hold**, so the movement can reference the real
>   order number. Without a transaction the half-written order is deleted again.
> - **`npm run seed:warehouses` is required** for the ledger to be live. Without a
>   default warehouse the bridge falls back to the pre-ledger behaviour and logs
>   one warning; that fallback is a migration aid, not a permanent design.
>
> `npm run reconcile` compares `Σ(quantity − reserved)` against `Product.stock`
> and only rewrites it with `--fix`.

### Reconciliation

Nightly 03:00 (`jobs/reconcileStock`):
1. Sum `Inventory.quantity − Inventory.reserved` per product
2. Compare to `Product.stock`
3. Log drift → correct → alert `ADMIN_ALERT_EMAIL`

`--fix` rewrites **only** `Product.stock`. It deliberately writes no
`StockMovement`: the `Inventory` rows were already correct, so an `adjust` row
would record a ledger change that never happened — and the next reconcile would
then "correct" the catalogue straight back, because the phantom movement implies
the product really did change.

### One-off migrations

All three are read-only by default; none needs to run on a fresh database.

| Command | Purpose |
|---|---|
| `npm run repair:reservations` | Orders shipped *before* the `commit` fix still hold their units. Reconcile cannot see them (both sides of its comparison are wrong by the same amount), so this finds them by looking for fulfilled orders whose hold was never settled. `-- --fix` clears them via a real `release` movement. |
| `npm run backfill:deltas` | Historical `StockMovement` rows predate the `delta` column. `-- --fix` derives each one from its `type`. |
| `npm run indexes:products` | Drops the stale text index on `Product`, then builds the indexes the schema declares. Read the deployment checklist before running with `-- --fix`: until this has been run on an existing database, no `Product` index exists at all. |

All three refuse to guess. `repair:reservations` skips orders with no warehouse
stamp and never releases more than is actually held, so it cannot drive
`reserved` negative. `backfill:deltas` reports old `transfer` rows as
unrecoverable rather than inventing a direction for them — their only record of
direction was a sign the schema used to reject. `indexes:products` drops only
indexes it can identify as *text* indexes the schema does not declare; anything
else extraneous is reported and left in place, because a hand-added index might
be there on purpose and dropping the wrong one is not something a report can
undo.

### Adding a Movement Type

1. Add to `MOVEMENT_TYPES` and `MOVEMENT_DELTAS` in `models/StockMovement.ts`
   (they live together — the schema's `delta` check is derived from that table)
2. Handle in `inventoryService.guardFilter()` — every type needs an explicit
   floor, or a concurrent movement can take the last unit
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
| `/internal` | Scheduled jobs (`release-expired`) | shared secret, no user session |
| `/reviews` | Reviews | public read, `protect` write |
| `/inventory` | Stock levels | `authorize('admin','manager','warehouse_staff')` |
| `/warehouses` | Warehouses | `authorize('admin','manager')` |
| `/internal` | Scheduled jobs (payment-expiry sweep) | shared secret, no user session |
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
3. `Product.stock` = Σ (`Inventory.quantity` − `Inventory.reserved`) — **availability**, not on-shelf units. The storefront reads this field directly, so units held for open orders must not look sellable. Verified by `npm run reconcile`.
4. `Inventory.reserved ≤ Inventory.quantity`
5. `PurchaseOrderItem.receivedQty ≤ PurchaseOrderItem.quantity`
6. `Order.warehouse` is stamped at checkout and is the *only* warehouse a later
   release or commit may touch. Resolving the current default instead would, for
   any order placed before a default changed, credit a warehouse that never held
   the units and strand the reservation.

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

### Payment Lifecycle

An order is created `pending` and holding stock. Two things can settle it, and
both are single guarded writes in `services/orderLifecycleService.ts`:

| Transition | Trigger | Effect |
|---|---|---|
| `pending` → `paid` | `PUT /orders/:id/pay` (admin), or a gateway webhook when one is wired in | money confirmed; stock stays deducted |
| `pending` → released | `POST /internal/orders/release-expired` (scheduler) | order cancelled via `cancelAndRestock()`, stock back on the shelf |

Rules:

- **Only online orders expire.** `AWAITING_ONLINE_PAYMENT_METHODS` (today:
  `stripe`) must be paid up front. `cash` is COD — settled on delivery — so it is
  a real order holding stock, never an abandoned checkout.
- **`PAYMENT_WINDOW_MINUTES`** (default `60`, `0` disables) bounds how long stock
  may be held unpaid. This is AGENT.md §9's `release` movement: "cancel /
  reservation expired".
- **Both directions are race-safe.** `markOrderPaid` filters on
  `paymentStatus: "pending"` and refuses a cancelled order; the sweep re-checks
  each row before cancelling it, so a payment that lands mid-sweep wins and the
  order is not released. A duplicate webhook reports `not_payable` (409) instead
  of re-running fulfilment.
- **A released order cannot be paid.** Its units are back on the shelf, so the
  money has to be refunded rather than booked against a live order.

Config is server-side only; covered by `server/tests/orderLifecycle.test.ts`.

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
reopen the replay window it exists to close. `connectDB()` calls `createIndexes()`
on boot, so **new** indexes here are applied by the next server start without a
manual migration. Because it no longer syncs, the older key-only index is *not*
dropped automatically — it stays as a harmless redundant index and can be removed
by hand whenever you like. See "Things I did not do" for why dropping is now
deliberate.

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

### Payments & Scheduled Jobs

| Method | Path | Auth | Notes |
|---|---|---|---|
| PUT | `/orders/:id/pay` | `admin` | mark an order paid (settled COD delivery, or a gateway callback); 409 when it is no longer awaiting payment |
| POST | `/internal/orders/release-expired` | `x-cron-secret` | cancel unpaid online orders past their window and restock them; `?limit=` 1–500 (default 100); 503 while `CRON_SECRET` is unset |

### Inventory

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/inventory` | `admin,manager,warehouse_staff` | `warehouse`, `page`, `limit` |
| GET | `/inventory/low-stock` | same | at or below reorder level |
| GET | `/inventory/:productId` | same | available units across warehouses |
| POST | `/inventory/adjust` | `admin,manager` | `{ productId, warehouseId, quantity /* signed */, reason }` — 409 if it would go negative |
| GET | `/inventory/movements` | `admin,manager,warehouse_staff` | `product`, `warehouse`, `type`, paginated |
| GET | `/warehouses` | `admin,manager` | |
| GET | `/warehouses/:id` | `admin,manager` | with a stock summary |
| POST | `/warehouses/:id/default` | `admin,manager` | demotes the incumbent in the same pass |

#### Admin

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/admin/stats` | `admin` | dashboard figures |
| GET | `/admin/users` | `admin` | paginated, for picking who to promote |
| PUT | `/admin/users/:id/role` | `admin` | `{ role }`; 400 on an unknown role, 409 if an admin tries to demote themselves |

Role changes are admin-only by design — §10 gives `manager` "everything except
user role changes", and this endpoint is the whole of that exclusion. A role is
also synced from Clerk's `publicMetadata.role`; an *absent* one is left alone, so
promoting someone in the database is not undone by their next sign-in.

`authorize(...roles)` is typed against `USER_ROLES`, so a typo in a route is a
compile error. That is not decoration: the routes were written with
`manager`/`warehouse_staff` while `User.role` accepted only `user`/`admin`, so
they compiled fine, matched nothing, and 403'd everyone.

### Testing

| Command | What it covers |
|---|---|
| `npm test` | Pure rules and fakes — pricing, cancellation, lifecycle, ledger arithmetic, purchasing, Clerk mapping, `authorize`. No database. |
| `npm test:integration` | The ledger, the Clerk sync, the checkout bridge, the operator scripts, and the payment lifecycle against a **real mongod** (`mongodb-memory-server`). |

The split is deliberate. Unit tests assert on pure functions, which proves the
*rules* but says nothing about Mongoose — not that a `$inc` lands, not that a
`pre("validate")` hook fires, not that a write happens once. Those are exactly
where the real bugs were, and two of them were invisible to the unit suite:

- **`receive()` and `transfer()` hardcoded `session = undefined`.** Both run
  inside `withOptionalTransaction`, which *re-runs its work* when the deployment
  has no transaction support (any standalone `mongod`, which is what most local
  setups and some deployments use). A movement issued outside the session
  survives the first attempt and lands again on the retry: **receiving 6 units
  recorded 12, and transferring 3 moved 6.** Phantom stock that nothing ordered.
  Both now thread the session, and a test pins each.
- **`applyMovement` did not upsert.** `npm run seed:warehouses` only walks the
  *default* warehouse, so any other warehouse had no `Inventory` rows — and
  receiving a purchase order into one, or transferring stock to one, threw
  `InsufficientStockError`. That message says "not enough stock" when the truth
  is "no such row". Arriving movements (`in`, `transfer_in`) now create the row
  they land in; outgoing ones still refuse, and a test proves a missing row
  stays missing.

`npm run test:integration` is kept out of `npm test` because it needs a mongod
binary; the unit suite must stay runnable anywhere. CI runs both.

### What the integration suite is actually for

It exists because **reading the code was not enough**. Three bugs got through
review and past 122 passing unit tests, every one of them invisible to a test
that asserts on a table rather than a document:

- `commit` leaving `reserved` stranded after a shipment.
- `receive()` and `transfer()` dropping the transaction session, so the
  standalone-MongoDB fallback applied every movement **twice**.
- The Clerk upsert skipping validation, so a typo'd role was stored.
- `Product` failing to build *any* index, because two text indexes were declared
  on schemas that are embedded inside it and `db.ts` swallowed the error.

The lifecycle suite covers the one place money and stock meet: cancelling
restocks exactly once, the expiry sweep never touches COD or a paid order, it is
safe to run twice, and an order whose stock was released can no longer be paid —
taking money for units that are already back on a shelf.

Two habits that cost real time, worth keeping:

- **Await `Model.init()`** in an integration test. Index builds are asynchronous,
  so a test that races one finds no unique constraint and its assertion quietly
  passes without testing anything.
- **A schema hook refusing your fixture is information, not an obstacle.** The
  "second warehouse" test could not create two defaults — the hook was right, and
  the fix was to demote the incumbent first, as the real API does.

### Known: search does not use an index

`Product` search (`searchProducts`) matches with a **case-insensitive regex**,
not `$text` — so a text index would not be used even if one existed. There is
none, deliberately: `colorSchema` and `variantSchema` each declared one, and both
are *embedded* in `Product`, so two text indexes landed on one collection. MongoDB
allows one per collection, `Product.init()` threw, and `db.ts` swallowed the
error — so **no Product index was ever built** and the catalogue was scanned.

Those indexes are removed and the false `name_text_description_text` comment in
`config/db.ts` is corrected. The integration suite now asserts `Product.init()`
resolves, so a regression fails CI instead of failing quietly on every boot.

Two follow-ups, both product decisions rather than bugs:

- **Regex search still scans.** Converting `searchProducts` to `$text` would use
  an index, but `$text` matches whole words, so partial matches like `oudw` for
  `Oud Wood` would stop working. That is a search-behaviour change, and a scan is
  survivable at this catalogue size.
- **`connectDB` uses `createIndexes()`, not `syncIndexes()`.** `syncIndexes`
  drops every index the schema does not declare, on every boot, so one
  incomplete schema could remove a production unique constraint — after which
  duplicates get written. The failure modes are not symmetric: a missing index
  makes queries slow and is visible; a dropped one corrupts data silently.
  Removing an index is now a deliberate manual act.

  **One-time cleanup needed on an existing deployment:** the two conflicting text
  indexes that used to sit on `Product` are still on the collection, because
  `createIndexes()` will not remove them. Run `npm run indexes:products -- --fix`
  (see the deployment checklist). `Product.syncIndexes()` would remove them too,
  but it drops *every* index the schema does not declare, which is the asymmetry
  this component exists to avoid — so it is not used here either.

## `escapeRegex` — mandatory for any user input in a query

`getProducts` and `searchProducts` are **public**: `productsRoutes.ts` registers
them with no `protect`. Every query parameter reaching a `$regex` there is
attacker-controlled, so it must go through `utils/escapeRegex.ts`.

Interpolating raw is not merely sloppy matching — it hands the caller their own
pattern:

- `?brand=a|b` becomes `^a|b$`. `|` binds looser than the anchors, so that
  matches any string starting with `a` **or** ending with `b`. The filter
  silently stops filtering and returns the wrong catalogue.
- `?size=(a+)+` is catastrophic backtracking — a remote CPU burn on an open
  endpoint.

The bug was inconsistency, not absence: `q` and `color` escaped correctly while
`brand`, `size` and the three category-title lookups did not. That is why the
helper exists as a single shared import rather than a sixth inline copy. When
adding a new filter, import it — do not paste a `.replace()` again.

Still regex rather than `$text`, deliberately: `$text` matches whole words, so
partial matches like `oudw` for `Oud Wood` would stop working. A scan is
survivable at this catalogue size; revisit with real numbers if search is slow.

### Client Layer

`client/config/*Api.ts` + `client/hooks/*` follow the `orderApi` / `useOrder`
pattern: one typed module per domain, one hook per query or mutation.

| Domain | API module | Hooks |
|---|---|---|
| Stock & warehouses | `config/inventoryApi.ts` | `useInventoryQuery`, `useLowStockQuery`, `useMovementsQuery`, `useWarehousesQuery`, `useAdjustStock` |
| Purchasing | `config/purchasingApi.ts` | `useSuppliersQuery`, `useCreateSupplier`, `usePurchaseOrdersQuery`, `usePurchaseOrderQuery`, `useCreatePurchaseOrder`, `useReceivePurchaseOrder`, `useTransfersQuery`, `useCreateTransfer`, `useSetTransferStatus` |
| Admin | `config/adminApi.ts` | `useAdminStats`, `useAdminUsers`, `useSetUserRole` |

Every hook is `enabled: Boolean(isSignedIn)`, so a screen can mount before Clerk
resolves without firing a request that will 401. Mutations invalidate what the
change actually affects — a receipt invalidates both the purchase order *and* the
inventory levels, because it changes what was ordered and what is on the shelf.

The movement types are mirrored in `inventoryApi.ts` and must match
`MOVEMENT_TYPES` on the server. They are not interchangeable: a `commit` settles
a hold, an `out` is stock that was never held.

### Warehouses / Suppliers / Purchase Orders / Transfers / Reports

See §10 for routes and roles.

#### Suppliers

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/suppliers` | `admin,manager` | `active`, `search`, paginated |
| GET | `/suppliers/:id` | `admin,manager` | with its products |
| POST | `/suppliers` | `admin,manager` | 400 on an invalid email |
| PUT | `/suppliers/:id` | `admin,manager` | allow-listed fields only |

#### Purchase Orders

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/purchase-orders` | `admin,manager` | `supplier`, `status`, paginated |
| GET | `/purchase-orders/:id` | `admin,manager` | with the supplier |
| POST | `/purchase-orders` | `admin,manager` | `{ supplierId, items:[{ productId, quantity, unitCost }] }`; product names are snapshotted server-side |
| POST | `/purchase-orders/:id/receive` | `admin,manager` | `{ warehouseId, items:[{ productId, quantity }] }` — **partial receipts allowed**; 409 when it would exceed what was ordered |
| PUT | `/purchase-orders/:id/cancel` | `admin,manager` | 409 once any line has stock in |

Status runs `draft → ordered → partially_received → received`, plus `cancelled`. Receiving
is the only thing that creates stock, and it is partial-friendly: a supplier splitting a
shipment is normal, not an error. Each line's `receivedQty` is incremented under a
conditional update (`receivedQty <= quantity - n` travels *into* the query), so two clerks
receiving the same units cannot both succeed.

#### Transfers

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/transfers` | `admin,manager,warehouse_staff` | `status`, `warehouse` (matches either side), paginated |
| GET | `/transfers/:id` | same | |
| POST | `/transfers` | same | `{ fromWarehouseId, toWarehouseId, items:[...] }` |
| PUT | `/transfers/:id/status` | same | `{ status }` — `completed` is the only value that moves stock |

Only the move to `completed` writes to the ledger, and it is guarded on the *current*
status so a double-submit cannot move the goods twice. `in_transit` is bookkeeping only.

### Webhooks

| Method | Path | Notes |
|---|---|---|
| POST | `/api/v1/clerk` | **must** be registered before `express.json()` — it needs the raw body for signature verification |

`user.created` / `user.updated` upsert the local `User`; `user.deleted` removes it.
Everything else gets a 200 so Clerk stops retrying it. The write goes through
`applyUserPlan` behind a `UserWriter`, so it is exercised against a real database
by `npm run test:integration`.

**Confirming a live delivery.** The crypto, the secret and every rejection path are
covered by tests, but no test can prove that Clerk's own request reaches the
server *through whatever proxy sits in front of it* — and a webhook that never
lands is not a degraded experience, it is every customer locked out behind
"user not found in database", because `protect` resolves the local `User` by
`clerkId`. So that has to be checked once, against the real deployment, by
sending a real event and looking at the database:

```
npm run verify:clerk-sync                          # the 5 most recent accounts
npm run verify:clerk-sync -- --recent 15           # only those synced just now
npm run verify:clerk-sync -- --clerk-id user_abc   # one specific account
```

Read-only, and it exits 2 when nothing arrived, so a check can tell "arrived"
from "did not" without reading the output. Send the event from Clerk's Webhooks
log, then run it with `--recent`: a new `user` row means the delivery landed and
the whole auth path is proven end to end.

This deliberately needs no dashboard access. The one thing that closes this gap
is a human clicking "send test event", so the only credential it ever required is
the signing secret already in `.env`.

The signature check is covered as well. `webhookSignature.integration.test.ts`
drives the real handler over a real socket, signing payloads with
`standardwebhooks` — the library Clerk itself verifies with — against a secret
generated per run, so no real credential is needed or committed. A tampered body
that reuses a genuine signature, a foreign secret, absent signature headers, a
replayed timestamp, an unset secret and a non-base64 secret are each refused with
a 400 and write nothing. All six are fail-closed, and that was confirmed by
mutating the handler to skip verification: 7 of the 10 tests fail when it does.

Two things that suite found, neither visible to a unit test:

- **`findOneAndUpdate` does not validate by default.** The upsert ran without
  `runValidators`, so a typo in Clerk's `publicMetadata.role` ("manage",
  "adminn") was stored happily — and `authorize` checks against `USER_ROLES`, so
  that user would be refused by every staff route with no explanation anywhere.
- **A test can silently not test anything if it races the index build.** The
  "one document per email" assertion passed against no unique constraint at all
  until the test awaited `User.init()`.

Two things the handler must never do, both of which it used to:

- **Assume an email address exists.** Clerk permits phone-only accounts, and the
  storefront's own sign-up asks for a phone number, so `email_addresses[0].email_address`
  was reachable. A throw here returns 400, which makes Clerk retry the *same*
  event indefinitely, and the customer can never be created — so `protect` 401s
  them forever. `email` is therefore optional and sparsely unique.
- **Read-then-write.** A retry landing between the read and the write created a
  second document, which tripped the unique index, returned 400, and was retried
  again. It is a single upsert now.

`role` is synced from Clerk's `publicMetadata.role` (must be one of §10's
roles). A role that is *absent* from metadata is left alone, so promoting
someone directly in the database is not undone by their next sign-in.
| POST | `/clerk` | Signature-verified raw body |

---

## 13. Verification & CI

Nothing in this repo used to be enforced: type errors and failing logic reached
`production` unnoticed. These are the checks that exist, and `.github/workflows/ci.yml`
runs exactly them on every push to `production` and on every pull request.

| Where | Command | Covers |
|---|---|---|
| `server/` | `npx tsc --noEmit --pretty false` | types — `noUnusedLocals` is on, so dead imports fail the build |
| `server/` | `npm run lint` | ESLint — unreachable code, floating promises, useless assignment |
| `server/` | `npm test` | `tests/pricing.test.ts` (the money math), `tests/cancel.test.ts` (stock coming back), `tests/orderLifecycle.test.ts` (payment expiry) |
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
- **The server ESLint config is not type-aware.** `tsc` already owns types, and
  `no-unsafe-*` rules would bury real findings under hundreds of style errors in a
  codebase that leans on `any` around mongoose. `no-explicit-any` is a warning, so
  the debt stays visible without failing a build (48 warnings today).
- **`types/express.d.ts` must stay a module.** Its `export {}` is what makes
  `declare global` legal; removing it silently drops the `req.user` augmentation
  and every controller stops compiling (TS2339).
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
6. Seed a `stripe` order with `paymentStatus: "pending"` and a `createdAt` older
   than the window → call `POST /api/v1/internal/orders/release-expired` with the
   right `x-cron-secret`: it reports `released: 1`, the order is `cancelled`, and
   stock returns. Call it again → `released: 0`.
7. `PUT /api/v1/orders/:id/pay` twice → first is 200, second is 409, and a
   `cash` order that is unpaid is never touched by the sweep.

### After the ledger migration — needs a live MongoDB

Run `npm run seed:warehouses` first; without a default warehouse the bridge logs
a warning and only `Product.stock` moves.

1. Place an order → `Inventory.reserved` rises by the ordered quantity,
   `Inventory.quantity` does **not** change, and `Product.stock` falls by the
   same amount.
2. `GET /inventory/movements?reference=<ORD-…>` → a `reserve` row exists for that
   order number.
3. Move the order to `shipped` → an `out` movement, `reserved` drops to 0 and
   `quantity` finally falls. Move it again to `delivered` → **no** second
   movement.
4. Cancel a `placed` order → a `release` row, `reserved` back to 0,
   `Product.stock` restored.
5. `npm run reconcile` → "No drift". If you skip the seed it will report every
   product, which is the expected signal that the ledger is not in use.

## Deployment checklist

One-time work on an existing database, in this order. **Every migration script is
read-only unless given `--fix`**, and all three refuse to guess — so run each
without the flag, read the report, and only then decide.

1. `npm run backfill:deltas` — `StockMovement.delta` predates the field. Reports
   what it would write; do not pass `--fix` while any order is mid-flight.
2. `npm run repair:reservations` — finds `Inventory.reserved` left behind by
   orders that died between reserving and writing. Bails out rather than repair
   when the reference is ambiguous, because a wrong release oversells stock.
3. `npm run reconcile` — compares `Σ(quantity − reserved)` to `Product.stock`.
   Drift here is expected on a database that predates the ledger; the two above
   must run first or the report is meaningless.
4. Only after reviewing: repeat each with `--fix`, then re-run `reconcile` and
   confirm "No drift".

**Then, once, on an existing deployment:**

- `npm run indexes:products` — drops the stale text index on `Product` and
  then builds the indexes the schema declares. It was created by a schema
  embedded inside `Product`; `Product.init()` could not build any index while it
  existed, so **no Product index was ever built** and every query that should have
  used one fell back to a collection scan. `createIndexes()` will not remove it,
  which is why this is a separate, deliberate step.
  Report-only by default, and exits 2 when there is something to drop. `-- --fix`
  removes it. It reads the resulting indexes back afterwards, so the "Final
  state" listing is evidence rather than a claim — that is the check the previous
  advice ("verify `db.products.getIndexes()` by hand") was asking for.

  Note it is *one* index, not the two older notes here claimed. MongoDB permits a
  single text index per collection, so the second one could never be created —
  which is exactly why `init()` failed. Had the first not been blocking the
  second, `init()` would have thrown on a duplicate-name error instead.

**Required environment before real traffic:**

- `CRON_SECRET` — until set, `POST /internal/orders/release-expired` returns 503
  and unpaid orders are never released. An unset secret means disabled, never open.
- `CLERK_WEBHOOK_SIGNING_SECRET` — the crypto path is now tested (see **Webhooks**):
  every rejection case is fail-closed, and this project's own secret was confirmed
  to be well-formed `whsec_` + base64 that the library accepts. What remains
  unverified is a *live* Clerk delivery through the host's proxy, so send one real
  event from the dashboard and confirm the `User` appears.
  The trap to know: a truncated or non-base64 secret makes `new Webhook(secret)`
  throw on every request, so every webhook returns 400 and no user is ever created.
  That is safe but total — it locks every customer out and reads exactly like a
  Clerk outage, so check this variable first if signups stop syncing.
- Pricing/window variables — the server recomputes every amount, so client values
  are display only. Wrong values here mean wrong invoices.
- A real payment webhook. Until one is wired, `PUT /orders/:id/pay` is the only
  path to `paid`, and it is admin-only by design.

**Smoke tests** (see the manual-test sections above for the full lists): Clerk
sync, checkout, payment expiry, cancel, shipping.



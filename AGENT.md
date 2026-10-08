# Lira (ليرة) — Complete Agent Context

> Single source of truth for AI agents and developers working on the **Lira (ليرة)** luxury artisanal e-commerce ecosystem.
> Includes: brand identity, design system, architecture, all clients, API, database, inventory domain, auth, notifications, deployment, and troubleshooting.

---

## 1. You Are Here

You are an expert **React Native + Expo / Node.js + Express / Electron** engineer helping build and maintain **Lira (ليرة)**, a production-quality luxury artisanal fashion e-commerce platform.

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

The Lira design system is the **visual contract** for every screen across Mobile, Admin, Storefront, and Desktop Cashier.

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
   - All clients share tokens via `@lira/shared`
   - Admin + Cashier stay LTR layout; Mobile + Storefront honor RTL

---

## 4. Project Overview

Lira is a **full-stack, multi-client e-commerce platform** for luxury fashion and artisanal goods targeting Arabic-speaking markets, with multi-language (AR/FR/EN) and multi-currency (TND/EUR/USD/SAR) support.

Six clients on one Express API, each purpose-built for a role:

| # | Client | Path | Stack | Role(s) | Purpose |
|---|---|---|---|---|---|
| 1 | **Mobile — User** | `apps/mobile-user/` | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 | `user` | Customer storefront (iOS/Android) |
| 2 | **Mobile — Manager** | `apps/mobile-manager/` | React Native + Expo | `manager` | Approvals, reports, staff oversight |
| 3 | **Mobile — Warehouse** | `apps/mobile-warehouse/` | React Native + Expo + camera | `warehouse_staff` | QR scanning, stock in/out, receiving |
| 4 | **Desktop — Cashier** | `apps/desktop-cashier/` | Electron + React + Vite + TS | `cashier` | POS, receipt printer, USB scanner |
| 5 | **Admin Web** | `apps/web-admin/` | React 18 + Vite + TS + shadcn/ui + TanStack Query/Table | `admin` | Inventory, orders, catalog, users, reports |
| 6 | **Storefront Web** | `apps/web/` | Next.js 14 (App Router) | public | Public SEO shop *(planned)* |

All clients consume REST at `/api/v1` and share types via `@lira/shared`.

| Layer | Stack |
|---|---|
| Mobile Clients | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 |
| Cashier Desktop | Electron + React + Vite + TypeScript, `electron-pos-printer` |
| Admin Web | React 18, Vite, TanStack Query/Table, shadcn/ui, Recharts |
| Storefront Web | Next.js 14 (App Router), Tailwind, TanStack Query |
| Authentication | Clerk (`@clerk/clerk-expo`, `@clerk/clerk-react`, `@clerk/express`) |
| Server | Node.js, Express v5, TypeScript, `tsx` |
| Database | MongoDB via Mongoose v9 |
| Real-time | Socket.IO (order updates, notifications) |
| Push Notifications | Expo Push Service (dev) → FCM/APNs (prod) |
| Cache / Queues | Redis + BullMQ *(planned)* |
| File Storage | Cloudinary |
| Email | Nodemailer |
| HTTP Client | Axios + TanStack React Query v4 |
| Deployment | Server on Vercel, Admin + Web on Vercel, Mobile via EAS, Cashier via Electron Builder |

---

## 5. Repository Structure

```
lira_app/
├── AGENT.md                 # This file
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── apps/
│   ├── mobile-user/         # Expo RN app — customer (role: user)
│   │   ├── app/
│   │   │   ├── _layout.tsx
│   │   │   ├── (auth)/
│   │   │   ├── (drawer)/
│   │   │   │   └── (tabs)/      # index, shop, cart, wishlist, profile
│   │   │   ├── product/
│   │   │   ├── checkout/
│   │   │   ├── order/
│   │   │   ├── address/
│   │   │   ├── payment-methods/
│   │   │   ├── reviews/
│   │   │   ├── notifications/   # notification center
│   │   │   ├── profile/
│   │   │   └── settings/
│   │   ├── components/
│   │   ├── config/              # API layer
│   │   ├── constants/
│   │   ├── context/             # SettingsContext
│   │   ├── hooks/
│   │   ├── notifications/       # registration, handlers, deep links
│   │   └── assets/
│   │
│   ├── mobile-manager/      # Expo RN app — manager (role: manager)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── approvals/
│   │   │   ├── reports/
│   │   │   └── staff/
│   │   └── ... (same structure as mobile-user)
│   │
│   ├── mobile-warehouse/    # Expo RN app — warehouse (role: warehouse_staff)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── scan/            # QR camera screen
│   │   │   ├── stock-in/
│   │   │   ├── stock-out/
│   │   │   ├── inventory-count/
│   │   │   └── history/
│   │   ├── offline/             # SQLite/AsyncStorage queue
│   │   └── ... (same structure)
│   │
│   ├── desktop-cashier/     # Electron POS
│   │   ├── src/main/            # main process, printer, kiosk
│   │   ├── src/renderer/        # React UI
│   │   ├── src/preload/         # IPC bridge
│   │   └── electron-builder.yml
│   │
│   ├── web-admin/           # Back Office (Vite)
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── layouts/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── api/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   └── web/                 # Storefront (Next.js) — planned
│
├── packages/
│   ├── shared/              # @lira/shared — types, schemas, tokens, roles
│   │   └── src/
│   │       ├── roles.ts             # USER_ROLES, CLIENT_ROLE_MAP
│   │       ├── types/               # Product, Order, User, Notification
│   │       ├── schemas/             # Zod
│   │       └── tokens/              # design tokens
│   ├── api-client/          # @lira/api-client — typed SDK
│   └── config/              # tsconfig, eslint
│
└── server/                  # Express API
    ├── server.ts
    ├── config/              # DB, Redis, Cloudinary, pricing
    ├── controllers/
    ├── routes/              # Mounted at /api/v1
    ├── middlewares/         # auth.ts, require-client.ts, upload.ts
    ├── models/              # incl. DeviceToken, Notification
    ├── services/            # incl. notifications.ts, push.ts
    ├── socket.ts            # Socket.IO setup
    ├── jobs/                # (reserved; see §15)
    ├── seeds/
    ├── templates/
    └── utils/
```

---

## 6. Architecture

### High-level Diagram

```
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Mobile     │ │ Mobile     │ │ Mobile     │ │ Desktop    │ │ Admin Web  │ │ Storefront │
│ User       │ │ Manager    │ │ Warehouse  │ │ Cashier    │ │ (Vite)     │ │ (Next.js)  │
│ (Expo)     │ │ (Expo)     │ │ (Expo)     │ │ (Electron) │ │            │ │            │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │              │              │              │
      └──────────────┴──────────────┴──────┬───────┴──────────────┴──────────────┘
                                          │ HTTPS / REST + Socket.IO
                             ┌────────────▼────────────────┐
                             │   Express API (/api/v1)     │
                             │   Clerk auth + RBAC         │
                             │   + clientId enforcement    │
                             └──┬───────┬────────┬─────────┘
                                │       │        │
                    ┌───────────▼─┐ ┌───▼────┐ ┌─▼───────────┐
                    │ MongoDB     │ │ Redis  │ │ Cloudinary  │
                    │ + Socket.IO │ │(planned│ │             │
                    └─────────────┘ └────────┘ └─────────────┘
                                          │
                             ┌────────────▼────────────┐
                             │  Expo Push Service      │
                             │  (dev) / FCM+APNs (prod)│
                             └─────────────────────────┘
```

### Principles

1. **One API, many clients.** No business logic duplicated in clients.
2. **Shared types via `@lira/shared`.** Never redefine `Product`, `Order`, `UserRole`, etc.
3. **Hooks own server state.** React Query lives in `hooks/` or `api/`.
4. **Inventory is event-sourced.** Every change = a `StockMovement`.
5. **Design tokens are shared.** All clients use the same palette via `@lira/shared/tokens`.
6. **RTL-first UI.** Every layout checks `isRTL` from settings.
7. **One app per role.** No role-routed mega-app — smaller bundles, cleaner auth, independent releases.
8. **Every API call carries `X-Client-Id`.** The backend enforces client ↔ role pairing at login and on every request.

### Layers

| Layer | Responsibility | Location |
|---|---|---|
| Routes | URL → controller | `server/routes/` |
| Middleware | Auth, clientId, uploads, errors | `server/middlewares/` |
| Controllers | Request → service → response | `server/controllers/` |
| Services | Business logic, transactions | `server/services/` |
| Models | Mongoose schemas, indexes | `server/models/` |
| Socket | Live updates (orders, notifications) | `server/socket.ts` |
| Jobs | Async work (reserved) | `server/jobs/` |
| Shared | Types, schemas, tokens, roles | `packages/shared/` |

---

## 7. Mobile Clients

Three separate Expo apps, each locked to its own role. They share design tokens, types, and API client via `packages/`.

### 7.1 `mobile-user` — Customer App

**Role:** `user`

**Purpose:** Browse products, place orders, receive notifications for new products and promotions, track deliveries.

**Key screens:**
- Auth (sign up / login)
- Home — categories, search, featured, editorial heroes
- Product detail
- Cart & checkout
- Order tracking (Socket.IO live updates)
- **Notifications center** (see §9)
- Wishlist
- Profile, addresses, payment methods

**Backend endpoints:** `GET /products`, `POST /orders`, `GET /orders/mine`, `POST /cart`, `GET /notifications`, `POST /notifications/devices`, etc.

### 7.2 `mobile-manager` — Manager App

**Role:** `manager`

**Purpose:** Approvals, real-time dashboards, staff oversight, reports on the go.

**Key screens:**
- Auth (login only)
- Dashboard — today's sales, orders, low-stock alerts
- Approvals — refunds, discounts, purchase orders
- Reports — revenue, top products, staff activity
- Staff monitor — cashier/warehouse activity
- Notifications — Socket.IO-driven alerts

**Backend endpoints:** `GET /reports/*`, `POST /approvals/*`, `GET /admin/users`, etc.

### 7.3 `mobile-warehouse` — Warehouse Staff App

**Role:** `warehouse_staff`

**Purpose:** **QR scanning** for stock in/out, receiving, inventory counts.

**Key screens:**
- Auth (login only)
- Scan (camera, `expo-camera` / `mobile_scanner`)
- Stock In — scan → confirm qty → submit
- Stock Out — scan → confirm → submit
- Inventory count — bulk scan mode, offline queue
- History — recent scans, sync status

**Offline-first is critical.** Warehouses have poor WiFi.

```ts
// Offline queue pattern
async function handleScan(code: string, action: "in" | "out") {
  const entry = { code, action, ts: Date.now(), id: uuid() };

  if (!isOnline()) {
    await queue.push(entry);            // persist to SQLite/AsyncStorage
    return;
  }
  try {
    await api.post("/inventory/scan", entry, {
      headers: { "X-Client-Id": "mobile-warehouse" }
    });
  } catch {
    await queue.push(entry);
  }
}

// Background sync when connectivity returns
useEffect(() => {
  const unsub = NetInfo.addEventListener(s => {
    if (s.isConnected) flushQueue();
  });
  return unsub;
}, []);
```

**Backend endpoint** (idempotent by client-generated `id`):

```ts
router.post(
  "/inventory/scan",
  authenticate,
  requireClient("mobile-warehouse"),
  requireRole("warehouse_staff", "admin"),
  async (req, res) => {
    const { code, action, id } = req.body;
    const existing = await ScanLog.findOne({ clientId: id });
    if (existing) return res.json(existing.result);   // replay-safe

    const product = await Product.findOne({ qrCode: code });
    if (!product) return res.status(404).json({ error: "Not found" });

    product.stock += action === "in" ? 1 : -1;
    await product.save();

    io.to("role:warehouse_staff").emit("inventory:updated", {
      productId: product._id, stock: product.stock,
    });

    const result = toPublicProduct(product);
    await ScanLog.create({ clientId: id, result, userId: req.user.id });
    res.json(result);
  }
);
```

### 7.4 Shared Patterns Across All Three Mobile Apps

- **Routing:** Expo Router v6, file-system, `(groupName)` groups.
- **Root layout:** `QueryClientProvider → ClerkProvider → SettingsProvider → GestureHandlerRootView → Stack`.
- **State:** TanStack React Query v4 — `staleTime: 2 min`, `cacheTime: 15 min`, `retry: 1`, `refetchOnWindowFocus: false`.
- **Auth:** Clerk SDK; each app validates its allowed role at login and refuses others.
- **API layer:** `config/*Api.ts` per domain, axios base URL from `EXPO_PUBLIC_API_URL`, `X-Client-Id` header injected globally.
- **Styling:** NativeWind v4 + tokens from `@lira/shared/tokens`.
- **Fonts (mobile-user, and mobile-manager if editorial):**
  - `jazera-bold` → Al-Jazeera-Arabic-Bold
  - `tajwal-medium` → Tajawal-Medium
  - `arabic-body` → IBMPlexSansArabic-Regular
- **Toasts:** `react-native-toast-message` with custom `toastConfig`.
- **Push notifications:** see §9.

### 7.5 Settings (`SettingsContext`)

| Setting | Options | Default |
|---|---|---|
| language | `ar`, `fr`, `en` | `ar` |
| currency | `TND`, `EUR`, `USD`, `SAR` | `TND` |
| theme | `light`, `dark`, `system` | `light` |
| phoneNotifications | boolean | `false` |
| emailNotifications | boolean | `false` |
| promoOptIn | boolean | `true` |
| newProductOptIn | boolean | `true` |

- `isRTL` derived from language
- Theme synced via `setColorScheme()` + `themeStore` singleton
- Persisted to AsyncStorage at `@lira/settings/v1`

### 7.6 Hooks (`mobile-user/hooks/`)

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
| `useNotifications` | Notification list + unread count (see §9) |

> ⚠️ `useProdoucts.ts` is an empty stub — always import from `useProducts.ts`.

### 7.7 Adding a New Screen

1. Create file under `app/`
2. Add hook in `hooks/useYourThing.ts` (React Query)
3. Add API fn in `config/yourThingApi.ts`
4. Use `CachedImage` for remote images
5. Apply design tokens from §3
6. Test in both `light`/`dark` and `ar`/`en`

---

## 8. Desktop Cashier App (`apps/desktop-cashier/`)

**Role:** `cashier`

**Purpose:** Scan items, checkout, print receipts.

| Concern | Choice |
|---|---|
| Framework | Electron + React + Vite + TypeScript |
| UI | Tailwind + large touch targets (min 44px) |
| Printer | `electron-pos-printer` (main process) |
| Scanner | USB HID → keyboard input into a hidden `<input>` |
| State | Zustand or Redux Toolkit |
| Auth | Clerk JWT (role: `cashier`), `X-Client-Id: desktop-cashier` |
| Real-time | Socket.IO (order updates, price changes) |
| Kiosk | `electron-kiosk` or custom fullscreen |
| Auto-update | `electron-updater` |

**Flow:**
1. Cashier logs in → backend validates `role === "cashier"` and `clientId === "desktop-cashier"`.
2. USB scanner types SKU into a focused input → cart updates.
3. Checkout → `POST /orders` with `Idempotency-Key` (see §12).
4. Backend saves order, reserves stock, emits `sale:created`.
5. Electron main process prints receipt.
6. Manager app + admin dashboard update live via Socket.IO.

**Never print from the renderer process** — always go through the main process for hardware access.

---

## 9. Notifications & Push (mobile-user)

New products and promotions are broadcast to every `user`-role account. Two delivery channels work together:

| Channel | Purpose | When |
|---|---|---|
| **Push (Expo Push Service)** | Reach device when app is closed | New product, promotion |
| **In-app (Socket.IO + DB)** | Live update when app is open | Same events + order updates |
| **Notification center** | Persisted history, unread badge | User opens app later |

### 9.1 Data Models

```ts
// server/models/DeviceToken.ts
const deviceTokenSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  token:      { type: String, required: true, unique: true },
  platform:   { type: String, enum: ["ios", "android"], required: true },
  clientId:   { type: String, default: "mobile-user" },
  lastSeenAt: { type: Date, default: Date.now },
  createdAt:  { type: Date, default: Date.now },
});
deviceTokenSchema.index({ userId: 1, token: 1 }, { unique: true });
```

```ts
// server/models/Notification.ts
const notificationSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:      { type: String, enum: ["new_product", "promotion", "order_update"], required: true },
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  imageUrl:  String,
  data:      { type: Schema.Types.Mixed },   // { productId } or { promoId }
  readAt:    { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });
```

```ts
// server/models/ScanLog.ts — replay guard for warehouse scanning
const scanLogSchema = new Schema({
  clientId: { type: String, required: true, unique: true },   // client-generated UUID
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  result:   { type: Schema.Types.Mixed },
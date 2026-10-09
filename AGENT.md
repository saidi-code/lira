# Lyra (ليرة) — Complete Agent Context

> Single source of truth for AI agents and developers working on the **Lyra (ليرة)** luxury artisanal e-commerce ecosystem.
> Includes: brand identity, design system, architecture, all clients, API, database, inventory domain, auth, notifications, deployment, and troubleshooting.

---

## 1. You Are Here

You are an expert **React Native + Expo / Node.js + Express / Electron** engineer helping build and maintain **Lyra (ليرة)**, a production-quality luxury artisanal fashion e-commerce platform.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction.

---

## 2. Brand Philosophy & Identity

Lyra merges ancient Arabic calligraphic artistry and royal Middle Eastern craftsmanship with contemporary quiet luxury. The brand communicates **heritage, bespoke curation, serenity, and tactile exclusivity**.

- **Brand Essence:** Bespoke · Artisanal · Timeless · Serene · Architectural
- **Brand Archetype:** High-End Editorial Boutique (Perfumes, Silks, Fine Leathers, Ceramics, Rare Jewelry)
- **Primary Mark:** Bespoke gold calligraphic wordmark "ليرة" with fluid ascenders, organic ligatures, and polished metallic sheen
- **Voice:** Quiet, confident, poetic. Never loud or salesy. Arabic-first, multilingual.

---

## 3. Design System

The Lyra design system is the **visual contract** for every screen across Mobile, Admin, Storefront, and Desktop Cashier.

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

Lyra balances **editorial serif elegance** with **crystal-clear sans-serif legibility** for transactional data (prices, numbers, SKUs).

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
   - Supported codes are `TND`, `EUR`, `USD`, and `SAR`. Format amounts with `usePrice()` on mobile or the shared `formatPrice()` helper on web; do not hardcode symbols or assume every amount is stored in the selected display currency.

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

### 3.7 Storefront Web Direction

The customer storefront at `apps/web/` uses an editorial, category-led shopping
flow inspired by the structure of [Albdah Oud](https://albdah.com/): a concise
announcement strip, clear shopping navigation, an image-led campaign, browsable
categories and collections, curated product rows, and a brand story near the end
of the page. This is structural inspiration only; do not copy Albdah's logo,
wording, product photography, colors, or other brand assets.

- Keep the Lyra palette, Arabic-first RTL layout, serif display headings, and warm
  quiet-luxury tone defined above. The reference site must never override Lyra's
  brand tokens.
- Build campaign and collection sections from active catalog data and product
  images from the Lyra API. Keep graceful visual fallbacks for missing banners or
  images; do not add unrelated stock photography.
- Show truthful product availability and use `formatPrice()` for customer-facing
  prices. Do not invent reviews, customer counts, delivery promises, discounts,
  or quality certifications to imitate reference content.
- Keep the storefront focused on shopping and customer account tasks. Do not add
  management or dashboard features to the public customer web app.
- Keep the header responsive: full shopping navigation and search on desktop,
  compact brand/cart actions and horizontally scrollable navigation on mobile.
  All interactive controls need accessible names and visible keyboard focus.
- Use responsive image-led cards, restrained gold accents, warm surfaces, subtle
  hover motion, and honor `prefers-reduced-motion`.
- Record future storefront design changes in this subsection when they establish
  a new page pattern, visual token, or interaction rule.

#### 3.7.1 Storefront Typography (apps/web only)

The storefront web app uses a different type pairing from the mobile clients.
Colors, radii, shadows, spacing, and motion rules are unchanged; only the two
type families differ.

| Role | Family | Weights | Where |
|---|---|---|---|
| **Display / Headings** | `Reem Kufi` | 400 · 500 · 600 · 700 | `font-serif`, hero titles, page heads, product names |
| **Body / UI / Data** | `Cairo` | 400 · 500 · 600 · 700 | `font-sans`, body copy, prices, badges, nav, forms |

- Both families load from Google Fonts with a single `<link>` in
  `app/layout.tsx` (weights pinned, `display=swap`). Do not use `next/font` for
  them: it requires network access to `fonts.googleapis.com` at build time and
  fails offline builds.
- Two CSS variables are the single source of truth for the pairing, set inline
  on `<body>` in `app/layout.tsx`:
  - `--font-display` → `"Reem Kufi", "Noto Serif", serif`
  - `--font-body` → `"Cairo", "IBM Plex Sans Arabic", system-ui, sans-serif`
- `tailwind.config.ts` maps `fontFamily.serif` to `var(--font-display)` and
  `fontFamily.sans` to `var(--font-body)`. `app/globals.css` repeats the same
  variables with static fallbacks for `body`, `.category-mark`,
  `.collection-placeholder`, and `.badge-count`. Change the family in all four
  places together, or the fallbacks will drift from the Tailwind classes.
- The `@next/next/no-page-custom-font` lint warning on the `<link>` is
  intentional and suppressed inline with a comment explaining why. Do not
  remove the suppression and do not reintroduce `next/font`.
- Mobile clients keep their existing families (`Noto Serif` / `Tajawal` /
  `Amiri` display and `IBM Plex Sans Arabic` body). This pairing is a
  storefront-only decision.

#### 3.7.2 Storefront Header Contract

`apps/web/components/Header.tsx` is a client component and carries the whole
shopping shell. It must always contain, in this order top-to-bottom:

1. **Announcement strip** (`.announcement-bar`) — brand line plus a gold `✦`
   separator. No prices, discounts, or shipping promises.
2. **Main row** — logo (`/images/lira_logo.png`, `next/image`), desktop nav
   (`lg:` and up), search form posting `q` to `/shop` (`xl:` and up), then the
   action cluster.
3. **Action cluster** — sign-in link / `UserButton`, the **favoris badge**, and
   the **cart badge**.
4. **Category chip strip** (`.menu-bar` / `.menu-chip`) — "كل الأقسام" plus up to
   twelve live categories from `catalogApi.categories()`, horizontally
   scrollable.
5. **Mobile nav** (`lg:hidden`) — the same `NAV` items, horizontally scrollable.

Rules for the two badges:

- Both are `<Link>`s to `/wishlist` and `/cart` using the shared
  `.header-action` class, each wrapping an inline SVG (`HeartIcon`, `BagIcon`).
- Counts come from TanStack Query, gated on `isSignedIn`, and reuse the exact
  query keys `["wishlist"]` and `["cart"]` so invalidation from any page
  refreshes the header. Cart counts `quantity`; favoris counts `items.length`.
- The count renders in `.badge-count` and only when greater than zero. It is
  `aria-hidden` — the count is already spoken through the link's `aria-label`
  (`المفضلة، 3 قطعة` / `حقيبة التسوق، 3 قطعة`).
- Never render a badge for a signed-out visitor, and never hardcode a count.
- Add a new header action by reusing `.header-action` + `.badge-count` rather
  than a bespoke absolute-positioned span.

#### 3.7.3 Storefront Page Layout Patterns

Every storefront route follows the same four-part shell, so pages stay
recognisable next to the reference structure:

1. **Breadcrumb** — `nav[aria-label="مسار التصفح"]` with `.crumb` links and
   `.breadcrumb-sep` separators.
2. **Page head** — `header.page-head` holding an `.eyebrow` kicker, one
   `font-serif text-3xl md:text-4xl` `h1`, and an optional muted count line.
3. **Body** — either a single column, a sidebar grid
   (`lg:grid-cols-[15rem_1fr]` on `/shop`), or a content + sticky summary grid
   (`lg:grid-cols-[1fr_20rem]` on `/cart` and `/checkout`).
4. **Empty state** — a centred `rounded-3xl` panel with a serif headline, one
   muted sentence, and a single gold CTA back to `/shop`. Never a bare
   `text-muted` sentence.

Route specifics:

| Route | Pattern |
|---|---|
| `/` | Hero → category tiles → collection cards → product grid → split brand story → three promise cards |
| `/shop` | Breadcrumb + page head, left category sidebar with active state (`aria-current="page"`), product grid, numbered pagination that preserves `q` and `category` |
| `/product/[id]` | Breadcrumb, main image plus up to four thumbnails (`useMemo`-deduped `gallery`), sticky buy column, color then size chips, low-stock and out-of-stock lines, add-to-bag + favoris buttons |
| `/cart` | Breadcrumb, page head with item count, image thumbnails per line, sticky `ملخص الحقيبة` summary with checkout and continue-shopping CTAs |
| `/checkout` | Breadcrumb, page head, address grid with `aria-pressed`, explicit cash-on-delivery note, sticky `ملخص الطلب` |
| `/wishlist` | Breadcrumb, page head with saved count, product-card grid with per-card add-to-bag and remove |
| `/orders` | Breadcrumb, page head, one row per order: Arabic-formatted date, status pill, total in `text-primary-dim` |

Product card rules:

- `components/ProductCard.tsx` stays a server component; all interactivity
  lives in the client child `components/ProductCardActions.tsx`. It exposes an
  add-to-bag button and a favoris heart, both redirecting signed-out visitors to
  `/sign-in` and both disabled when `stock <= 0`.
- The quick actions sit in `.card-actions` (revealed on `:hover` /
  `:focus-within`, always visible under `@media (hover: none)`). The wrapper
  calls `preventDefault()` + `stopPropagation()` so a click never navigates to
  the product page.
- Prices always come from `formatPrice(amount, "TND")`. Availability badges are
  truthful: `نفدت الكمية` only when `stock <= 0`.

---

## 4. Project Overview

Lyra is a **full-stack, multi-client e-commerce platform** for luxury fashion and artisanal goods targeting Arabic-speaking markets, with multi-language (AR/FR/EN) and multi-currency (TND/EUR/USD/SAR) support.

Six clients on one Express API, each purpose-built for a role:

| # | Client | Path | Stack | Role(s) | Purpose |
|---|---|---|---|---|---|
| 1 | **Mobile — User** | `apps/mobile-user/` | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 | `user` | Customer storefront (iOS/Android) |
| 2 | **Mobile — Manager** | `apps/mobile-manager/` | React Native + Expo | `manager` | Inventory, purchasing, and transfers |
| 3 | **Mobile — Warehouse** | `apps/mobile-warehouse/` | React Native + Expo | `warehouse_staff` | Inventory visibility and stock transfers |
| 4 | **Desktop — Cashier** | `apps/desktop-cashier/` | Electron + React + Vite + TS | `cashier` | POS, receipt printer, USB scanner |
| 5 | **Admin Web** | `apps/web-admin/` | React 18 + Vite + TS + shadcn/ui + TanStack Query/Table | `admin` | Inventory, orders, catalog, users, reports |
| 6 | **Storefront Web** | `apps/web/` | Next.js 14 (App Router) | public | Public storefront and checkout |

All clients consume REST at `/api/v1` and share types via `@lira/shared`.

#### App Display Names

The product name is **Lyra** in Latin script and **ليرة** in Arabic — they are the
same word, so the Arabic mark never changes. Use the following per-app **display**
names (what users see on the home screen, window title, or app store):

| Client | Display name | Where |
|---|---|---|
| Mobile — User | `ليرة` | `apps/mobile-user/app.json` → `expo.name` |
| Mobile — Manager | `Lyra Manager` | `apps/mobile-manager/app.json` → `expo.name` |
| Mobile — Warehouse | `Lyra Warehouse` | `apps/mobile-warehouse/app.json` → `expo.name` |
| Desktop — Cashier | `Lyra Cashier` | `electron-builder.yml` `productName`, menu, receipt, header |
| Admin Web | `Lyra Admin` | `apps/web-admin/index.html` `<title>`, sidebar |
| Storefront Web | `ليرة — Lyra` | `apps/web/app/layout.tsx` `metadata.title`, header/footer |

Customer-facing apps keep the Arabic wordmark (ليرة) as the primary mark; staff apps
are English/LTR and use role-suffixed names.

**Do NOT rename technical identifiers** when rebranding display names. These stay as-is:
`@lira/shared`, `@lira/config`, `@lira/api-client`, `com.lira.desktop-cashier`, Expo
`slug`s, npm package `name`s, the `lira_app/` repo folder, `/images/lira_logo.png`, the
`lira-lilac.vercel.app` API host, and test fixtures. A display rename is cosmetic; the
scoped package names and reverse-DNS IDs are load-bearing for installs, deep links, and
distribution.

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
| Push Notifications | Expo Push Service for customer promotions and new-product announcements |
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
│   │   └── app/             # manager-only inventory, purchasing, transfers
│   │
│   ├── mobile-warehouse/    # Expo RN app — warehouse (role: warehouse_staff)
│   │   └── app/             # warehouse-only inventory and transfer workflows
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
│   └── web/                 # Storefront (Next.js 14 App Router)
│       ├── app/             # routes + globals.css (component classes)
│       ├── components/      # Header, ProductCard, ProductCardActions, Providers
│       ├── lib/             # api, catalog, shop (cart/wishlist/order/address)
│       └── public/images/   # lira_logo.png
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
    ├── middlewares/         # auth.ts, errorHandler.ts, upload.ts
    ├── models/              # Mongoose schemas and indexes
    ├── services/            # Business logic and domain services
    ├── socket.ts            # Socket.IO setup
    ├── jobs/                # Background jobs (when present)
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
                             │   + role-based authorization│
                             └──┬───────┬────────┬─────────┘
                                │       │        │
                    ┌───────────▼─┐ ┌───▼────┐ ┌─▼───────────┐
                    │ MongoDB     │ │ Redis  │ │ Cloudinary  │
                    │ + Socket.IO │ │ planned│ │             │
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
8. **The API owns data access.** Every private route authenticates the account and authorizes its role; never rely on hidden tabs or client-only checks to protect data.
9. **Keep app roles exclusive.** Customer mobile accepts guests and `user`; manager mobile accepts `manager`; warehouse mobile accepts `warehouse_staff`; desktop cashier accepts `cashier`; admin web accepts `admin`. A screen guard improves navigation, while `authorize(...)` on the API remains the data security boundary.

### Layers

| Layer | Responsibility | Location |
|---|---|---|
| Routes | URL → controller | `server/routes/` |
| Middleware | Auth, role authorization, uploads, errors | `server/middlewares/` |
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

**Purpose:** Browse products, place orders, manage the customer account, and track deliveries.

**Key screens:**
- Auth (sign up / login)
- Home — categories, search, featured, editorial heroes
- Product detail
- Cart & checkout
- Order tracking (Socket.IO live updates)
- Customer notification inbox and unread badge; see §9 for the push and staff publishing flow.
- Wishlist
- Profile, addresses, payment methods

**Backend endpoints:** Check `server/routes/` and `server/controllers/` for current route names and authorization requirements before adding or documenting an API. Do not add admin endpoints or admin screens to this app.

### 7.2 `mobile-manager` — Manager App

**Role:** `manager`

**Purpose:** Manager operations on inventory, purchasing, and inter-warehouse transfers.

**Key screens:**
- Auth (login only)
- Inventory levels, low-stock view, adjustments, and movement history
- Suppliers and purchase orders
- Inter-warehouse transfers
- Account password settings

The app is restricted to the `manager` role. Admin-only dashboard, order, product, and staff-management screens belong in `apps/web-admin/`.

### 7.3 `mobile-warehouse` — Warehouse Staff App

**Role:** `warehouse_staff`

**Purpose:** Warehouse staff inventory visibility and transfers. The app is
restricted to the `warehouse_staff` role.

**Key screens:**
- Auth (login only)
- Inventory levels and movement history
- Create and process inter-warehouse transfers
- Account password settings

Camera scanning, stock receiving/out, inventory counts, and offline sync are not
implemented yet. Keep them out of the navigation until their API and ledger-safe
workflows are ready.

**Inventory changes must use the inventory service.** Do not mutate `Product.stock`
or write `Inventory` rows directly from a route or client. `server/services/inventoryService.ts`
applies guarded movements and writes the matching `StockMovement` audit row. Use
the existing inventory endpoints and service. A scan handler that directly updates
stock would bypass the ledger and could double-count concurrent or retried scans.

For any future offline scan queue, persist a unique operation ID with each entry,
validate the operation and warehouse on the server, and make replay protection
atomic with the stock movement. Retrying a queued request must never apply a
movement twice. Do not add an offline scan endpoint until it can preserve these
invariants.

### 7.4 Shared Patterns Across All Three Mobile Apps

- **Routing:** Expo Router v6, file-system, `(groupName)` groups.
- **Root layout:** `QueryClientProvider → ClerkProvider → SettingsProvider → GestureHandlerRootView → Stack`.
- **State:** TanStack React Query v4 — `staleTime: 2 min`, `cacheTime: 15 min`, `retry: 1`, `refetchOnWindowFocus: false`.
- **Auth:** Clerk SDK; the app root allows only its assigned role and sends other roles to a sign-out screen. Guests may browse the customer app.
- **API layer:** `config/*Api.ts` per domain, axios base URL from `EXPO_PUBLIC_API_URL`. Backend route authorization is authoritative; app route guards are not a substitute.
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
| State | Follow the state pattern already used in `src/`; avoid adding a second state library without a concrete need. |
| Auth | Clerk JWT (role: `cashier`); the client ID header is informational, not an authorization boundary. |
| Real-time | Verify the current implementation before relying on Socket.IO events. |
| Kiosk mode | Planned; no kiosk package is currently declared. |
| Auto-update | `electron-updater` dependency is present; confirm release configuration before treating updates as operational. |

**Flow:**
1. Cashier logs in → backend validates `role === "cashier"`.
2. USB scanner types SKU into a focused input → cart updates.
3. Checkout → use the existing orders API and its server-side idempotency contract; verify the route and key format before changing it.
4. Backend saves order, reserves stock, emits `sale:created`.
5. Electron main process prints receipt.
6. Manager app + admin dashboard update live via Socket.IO.

**Never print from the renderer process** — always go through the main process for hardware access.

---

## 9. Notifications & Push

Customer announcements are stored in MongoDB and delivered through Expo Push Service.
Only admins and managers can publish promotions or new-product announcements. The
customer app registers push devices only for signed-in `user` accounts when phone
notifications are enabled; customers can also read announcements in the inbox.

| Channel | Purpose | When |
|---|---|---|
| **Push (Expo Push Service)** | Reach device when app is closed | New product, promotion |
| **In-app (MongoDB)** | Persisted announcement history | Customer opens the notification center |
| **Socket.IO** | Not currently used for announcement delivery | Push is sent separately through Expo |

### 9.1 Implementation requirements

Implemented locations: `server/routes/notificationRoutes.ts`,
`server/controllers/notificationController.ts`, `server/models/Notification.ts`,
`server/models/NotificationRead.ts`, `server/models/PushDevice.ts`, and the customer
app's `components/PushNotificationRegistration.tsx` and notifications screen.
`server/vercel.json` routes the API through the Express application.

- Store device tokens per authenticated user and platform; refresh tokens on app
  startup and remove them when customers opt out or sign out. Expo ticket errors
  for `DeviceNotRegistered` remove the invalid token.
- Persist announcements before attempting dispatch so temporary Expo failures do
  not lose the in-app announcement.
- Respect the phone notification preference and keep the in-app inbox available
  independently of push permission.
- Scope notification reads and updates to the authenticated user; never trust a
  client-supplied user ID.
- Inbox responses are paginated (up to 50 entries) and unread counts are calculated
  from per-user read receipts. Push messages contain announcement text and an
  optional product ID only; never include private order or account data.
- Set `EXPO_PUBLIC_EAS_PROJECT_ID` when building the mobile app. Configure the
  Android FCM and iOS APNs credentials for the EAS project before expecting device
  delivery. `EXPO_ACCESS_TOKEN` on Vercel is optional unless Expo push security is
  enabled for the project.

The announcement route uses `authorize("admin", "manager")`; never weaken that
server-side check or rely on hiding the send form as the only permission boundary.

### 9.2 Mobile-user startup and CI troubleshooting

- If Metro reports `Unable to resolve "expo-device"` or
  `Unable to resolve "expo-notifications"` from the push registration component,
  confirm both packages are declared in `apps/mobile-user/package.json` and its
  `package-lock.json`. Install from `apps/mobile-user` with `npm ci`, then restart
  Metro with `npm run start -- --clear`. Do not work around a missing module by
  removing the push registration feature.
- Expo Go (Android, SDK 53+) does not support remote push notifications. Avoid a
  top-level import of `expo-notifications` in app startup code: it can throw
  before the app renders. Check `Constants.executionEnvironment` and dynamically
  import the module only outside Expo Go. This keeps Expo Go usable for ordinary
  app development; test remote push delivery in an Expo development build.
- If React Navigation logs that passing an object to `navigate` is deprecated,
  use Expo Router's `router.push("/path")` for app route navigation. For a warning
  emitted inside the tab navigator, check the resolved
  `@react-navigation/bottom-tabs` version and its `CommonActions.navigate` call;
  keep the package lock consistent with `package.json` and use a version that
  calls `navigate(name, params)` instead of passing a route object.
- A Clerk development-key warning is informational during local development. It
  is not a Metro resolution or navigation failure. Use production Clerk keys in
  production configuration; never copy secrets into this file.
- GitHub Actions working directories must match actual repository folders. The
  mobile apps live under `apps/mobile-user`, `apps/mobile-manager`, and
  `apps/mobile-warehouse`; web apps live under `apps/web` and `apps/web-admin`;
  the API lives under `server`. When changing a workflow working directory,
  verify its install/test/build commands and local `file:` dependencies from
  that directory. Keep `package.json` and `package-lock.json` in sync so `npm ci`
  works in CI.

## 10. SKU inventory and safe migration

- A simple product is one sellable SKU. It may have `featureImage` plus an
  `images` gallery; its stock is held in `SkuInventory` by product, SKU, and
  warehouse.
- A variable product has color records with `featureImage` and `images`, and
  exactly one size per variant SKU. Each color/size SKU has independent stock.
  `variant.stock` and `Product.stock` are compatibility snapshots of available
  units; `SkuInventory.quantity` and `reserved` are authoritative.
- Warehouse bin location belongs to the SKU inventory row. Every adjustment,
  receipt, transfer, order reservation, release, and fulfillment must include
  the SKU and use `server/services/inventoryService.ts`. Never mutate stock
  snapshots directly.
- New purchase orders and transfers for variable products must specify the
  intended SKU. Do not group multiple sizes under one SKU or guess a warehouse
  split when legacy stock was stored only at product level.
- Before deploying the SKU stock paths to an existing database, run
  `npm run migrate:sku-inventory` in `server` for a read-only preview. Resolve
  every reported blocker, make a MongoDB backup, then run
  `npm run migrate:sku-inventory -- --apply`. The migration is additive: it
  leaves legacy `Inventory` rows in place and stores snapshots of documents it
  enriches in `skuInventoryMigrationSnapshots` and
  `skuInventoryDocumentSnapshots`. It refuses to write when SKU, size, or
  warehouse allocations cannot be derived safely. Never bypass those blockers
  by distributing stock arbitrarily.

---

## 11. Deployment — Storefront Web (`apps/web`) on Vercel

The storefront is deployed to Vercel as project **`web`** (connected to the
`saidi-code/lira` GitHub repo). Production alias:
**https://web-theta-jade-30.vercel.app**. The API it talks to is the existing
Express deployment at `https://lira-lilac.vercel.app/api/v1`.

### 11.1 The monorepo gotcha (read before deploying again)

`apps/web` is a Next.js app, but the repo has **no workspace root** (no
`pnpm-workspace.yaml`, no root `package.json` workspaces). `apps/web` consumes
shared code through a `file:` dependency:

```jsonc
// apps/web/package.json
"@lira/shared": "file:../../packages/shared"
```

If you deploy by running `vercel deploy` **from inside `apps/web`**, the CLI
uploads only that subdirectory. `packages/shared` is not included, `npm ci`
symlinks `@lira/shared` to a path that does not exist on the build machine, and
the build fails with `Module not found: Can't resolve '@lira/shared'`.

The correct setup for this monorepo:

- **Root Directory** on the Vercel project is set to **`apps/web`**
  (`vercel project update --root-directory apps/web`). Vercel runs the build,
  install, and dev commands from there.
- Deploy from the **repository root**, not from `apps/web`. This uploads the
  whole repo so `../../packages/shared` is present on the build machine. The
  project link for a root-level deploy lives in `.vercel/project.json` (copied
  from `apps/web/.vercel/project.json`; both point at the same `projectId`).
- A root **`.vercelignore`** keeps the upload small: it excludes `server`, the
  mobile apps, `apps/web-admin`, `apps/desktop-cashier`, and build output, but
  **keeps `packages/`** — `@lira/shared` must stay in the upload.

Do not "fix" a failed build by vendoring shared code into `apps/web` or by
switching `@lira/shared` to relative imports. That breaks the single-source-of-
truth rule (see §3 and the repo-structure section): every client must share
types through `@lira/shared`.

### 11.2 Required environment variables

Set these as project env vars on Vercel (Production). `NEXT_PUBLIC_*` values are
inlined into the client bundle at build time, so pass them with `--build-env`
when deploying via CLI.

| Variable | Value / source |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://lira-lilac.vercel.app/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_...`) |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

Never commit real secrets. `apps/web/.env` holds local values only and is
git-ignored. The GitHub Actions workflow (`.github/workflows/ci.yml`) builds
`apps/web` with a **dummy** publishable key purely to exercise prerender; real
auth through the deployed proxy is verified by hand.

### 11.3 Deploy command (CLI, production)

```bash
# from the repository root, linked via .vercel/project.json
vercel deploy --prod --yes \
  --build-env NEXT_PUBLIC_API_URL=https://lira-lilac.vercel.app/api/v1 \
  --build-env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
  --build-env CLERK_SECRET_KEY=sk_... \
  --build-env NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in \
  --build-env NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up \
  --env NEXT_PUBLIC_API_URL=https://lira-lilac.vercel.app/api/v1 \
  --env NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_... \
  --env CLERK_SECRET_KEY=sk_... \
  --env NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in \
  --env NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 11.4 Build expectations and verification

A clean production build compiles all 12 routes: `/`, `/cart`, `/checkout`,
`/checkout/success`, `/orders`, `/orders/[id]`, `/product/[id]`, `/shop`,
`/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`, `/wishlist`, plus
middleware. Verify a live deploy without a browser session:

```bash
vercel curl https://web-theta-jade-30.vercel.app/
```

**Deployment Protection (Vercel Authentication) is on** for this project, so
the public URL returns an auth wall to anonymous requests — this is expected.
The build itself is the source of truth for a successful deploy; check the
production build log with
`vercel inspect <deployment-url> --logs` if a route misbehaves.


# Lyra App — Agent Context

You are an expert **React Native + Expo / Node.js + Express** engineer helping build and maintain **Lyra**, a production-quality fashion e-commerce application.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction.

---

## Project Overview

Lyra is a **full-stack mobile e-commerce app** for fashion (clothing/accessories) targeting Arabic-speaking markets, with multi-language (AR/FR/EN) and multi-currency (TND/EUR/USD/SAR) support.

| Layer | Stack |
|---|---|
| Mobile Client | React Native 0.81, Expo SDK 54, Expo Router v6, NativeWind v4 (Tailwind CSS) |
| Authentication | Clerk (`@clerk/clerk-expo` + `@clerk/express`) |
| Server | Node.js, Express v5, TypeScript, `tsx` runtime |
| Database | MongoDB via Mongoose v9 |
| File Storage | Cloudinary |
| Email | Nodemailer |
| HTTP Client | Axios + TanStack React Query v4 |
| Deployment | Server on Vercel (`https://lira-lilac.vercel.app`) |

---

## Repository Structure

```
lyra_app/
├── AGENT.md
├── client/                  # Expo React Native app
│   ├── app/                 # Expo Router file-system routes
│   │   ├── _layout.tsx      # Root layout (providers: QueryClient, Clerk, Settings, GestureHandler, Toast)
│   │   ├── (auth)/          # signIn.tsx, signUp.tsx
│   │   ├── (drawer)/        # Drawer navigator
│   │   │   └── (tabs)/      # Bottom tabs: index, shop, cart, wishlist, profile
│   │   ├── product/         # Product detail screen
│   │   ├── checkout/        # Checkout flow
│   │   ├── order/           # Order tracking/history
│   │   ├── address/         # Address management
│   │   ├── payment-methods/ # Payment method management
│   │   ├── reviews/         # Reviews screen
│   │   ├── profile/         # Profile screens
│   │   ├── settings/        # App settings
│   │   └── admin/           # Admin panel screens
│   ├── components/          # Shared UI components
│   ├── config/              # API layer (axios clients + per-resource API functions)
│   ├── constants/           # Config, theme store, colors, translations
│   ├── context/             # SettingsContext (language, currency, theme, notifications)
│   ├── hooks/               # Custom hooks (useCart, useOrder, useAddress, useFavoris, etc.)
│   └── assets/              # Fonts (Tajawal, IBM Plex Sans Arabic, Al-Jazeera), images
│
└── server/                  # Express API
    ├── server.ts            # Entry point
    ├── config/              # DB connection
    ├── controllers/         # Business logic per resource
    ├── routes/              # Express routers (mounted at /api/v1)
    ├── middlewares/         # auth.ts (protect + authorize), upload.ts (multer)
    ├── models/              # Mongoose schemas
    ├── services/            # External service integrations
    ├── seeds/               # DB seeding scripts
    ├── templates/           # Email/invoice HTML templates
    └── utils/               # Shared helpers
```

---

## Client Architecture

### Routing (Expo Router v6)
- File-system routing; groups use `(groupName)` convention.
- Root layout wraps everything: `QueryClientProvider → ClerkProvider → SettingsProvider → GestureHandlerRootView → Stack`.
- `AuthModalContainer` (inside root layout) shows a login/register modal driven by `useAuthModal()` from `useCart.ts`.
- Toast notifications via `react-native-toast-message` with custom `toastConfig`.

### State Management
- **Server state**: TanStack React Query v4 — `staleTime: 2 min`, `cacheTime: 15 min`, `retry: 1`, `refetchOnWindowFocus: false`.
- **App settings**: `SettingsContext` — persisted to AsyncStorage at key `@lyra/settings/v1`.
- **Auth state**: Clerk SDK.

### API Layer (`client/config/`)
- `api.ts` — Base `apiClient` (axios). Base URL resolves from `EXPO_PUBLIC_API_URL` env var, falling back to the Vercel deployment URL.
- Per-resource files: `productApi.ts`, `cartApi.ts`, `orderApi.ts`, `addressApi.ts`, `favorisApi.ts`, `reviewApi.ts`, `collectionApi.ts`.
- Auth tokens are injected per-request (pass `Authorization` header from Clerk via `options.headers`).

### Styling
- **NativeWind v4** (Tailwind CSS for React Native). Config in `tailwind.config.js`, global styles in `global.css`.
- Custom Arabic fonts loaded in root layout:
  - `jazera-bold` → Al-Jazeera-Arabic-Bold
  - `tajwal-meduim` → Tajawal-Medium
  - `arabic-body` → IBMPlexSansArabic-Regular

### Internationalization & Settings (`SettingsContext`)
| Setting | Options | Default |
|---|---|---|
| language | `ar`, `fr`, `en` | `ar` |
| currency | `TND`, `EUR`, `USD`, `SAR` | `TND` |
| theme | `light`, `dark`, `system` | `light` |
| phoneNotifications | boolean | `false` |
| emailNotifications | boolean | `false` |

- `isRTL` is derived from the selected language direction.
- Theme is applied to NativeWind via `setColorScheme()` and synced to a `themeStore` singleton used for inline styles.

### Custom Hooks (`client/hooks/`)
| Hook | Purpose |
|---|---|
| `useCart` | Cart CRUD + `useAuthModal` (exported separately) |
| `useOrder` | Order creation, listing, tracking |
| `useAddress` | Address CRUD |
| `useFavoris` | Wishlist/favourites |
| `useProducts` | Product listing with filters |
| `useCollections` | Collections (featured/promotional groups) |
| `useCategories` | Product categories |
| `useReviews` | Product reviews |
| `useDebouncedSearch` | Search with debounce |
| `usePrice` | Currency-aware price formatting |
| `useTranslation` | UI string translations |

> ⚠️ `useProdoucts.ts` (typo in filename) is an empty stub — always import from `useProducts.ts`.

---

## Server Architecture

### Entry Point (`server.ts`)
- Clerk webhook handler registered **before** `express.json()` middleware (requires raw body).
- Middleware order: `cors()` → `express.json()` → `clerkMiddleware()` → routes.
- All API routes mounted at `/api/v1`.

### Routes (`/api/v1/...`)
| Route | Resource |
|---|---|
| `/products` | Product CRUD, filtering, search |
| `/cart` | Cart management |
| `/wishlist` | Wishlist (favourites) |
| `/collections` | Collections |
| `/categories` | Categories |
| `/addresses` | User addresses |
| `/orders` | Orders |
| `/reviews` | Product reviews |
| `/admin` | Admin dashboard ops |
| `/clerk` | Clerk webhook (user sync) |

### Authentication & Authorization (`middlewares/auth.ts`)
- `protect` — Validates Clerk session via `req.auth()`, looks up internal `User` by `clerkId`, attaches `req.user`.
- `authorize(...roles)` — Role-based guard middleware. Checks `req.user.role`.

### Data Models (`server/models/`)
| Model | Key Fields |
|---|---|
| `Product` | name, type (`simple`/`variable`), sku, price, stock, category, subCategory (`man`/`woman`/`kids`), colors, sizes, images, isFeatured, isActive |
| `Order` | user, orderNumber (`ORD-YYYYMMDD-XXXXXX`), items[], shippingAddress, paymentMethod, paymentStatus, orderStatus, subtotal, shippingCost, tax, totalAmount |
| `Cart` | user, items[] |
| `Address` | user, type (`Home`/`Work`/`Other`), street, city, state, zipCode, phoneNumber |
| `User` | clerkId, role |
| `Category` | name, parent |
| `Collections` | name, products[] |
| `Review` | product, user, rating, comment |
| `WishList` | user, products[] |
| `Varianats` | (filename has typo) size, color refs for variable products |
| `Colors` | hex, name |

**Product Indexes**: `isActive+createdAt`, `isActive+price`, `isActive+brand`, `colors.hex`, `sizes`, `category+isActive`.

**Order Number Format**: `ORD-YYYYMMDD-<6 random alphanumeric>` — auto-generated in a `pre('save')` hook with collision retry (max 5 attempts, timestamp fallback).

---

## Environment Variables

### Client (`client/.env`)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...
EXPO_PUBLIC_API_URL=...          # Optional; falls back to Vercel URL
```

### Server (`server/.env` — see `server/.env.example`)
```
PORT=3000
MONGODB_URI=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
```

---

## Development Workflow

### Running the Client
```bash
cd client
npm start          # Expo dev server (scan QR with Expo Go)
npm run tunnel     # Expo with ngrok tunnel (for physical devices)
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator
```

### Running the Server
```bash
cd server
npm run server     # nodemon + tsx (hot reload) — use for development
npm start          # Single run with tsx
npm run build      # Compile TypeScript to dist/
npm run seed       # Seed products to DB
```

---

## Coding Conventions

1. **TypeScript everywhere** — strict types; avoid `any` unless genuinely necessary.
2. **Hooks own server state** — all React Query logic lives in `hooks/`, not in components or screens.
3. **API functions are pure** — `config/` files export plain async functions; no React imports.
4. **Controllers are thin** — delegate complex business logic to `services/` or model methods.
5. **Consistent server response shape**: `{ success: boolean, data?: any, message?: string }`.
6. **RTL-aware UI** — always check `isRTL` from `useSettings()` when positioning elements, text alignment, or flex direction.
7. **Currency formatting** — use `usePrice()` hook; never hardcode currency symbols.
8. **Image handling** — use the `CachedImage` component (wraps `expo-image`) for all remote images.
9. **No duplicate picker libraries** — project has multiple picker libs; prefer `react-native-dropdown-picker` for new dropdowns.
10. **Named exports for hooks**, default exports for screens and components.

---

## Known Issues / Gotchas

| Issue | Location | Status |
|---|---|---|
| `useProdoucts.ts` is an empty stub (typo in filename) | `client/hooks/useProdoucts.ts` | ✅ Safe — already re-exports everything from `useProducts.ts` |
| `Varianats.ts` model filename has a typo | `server/models/Varianats.ts` | ⚠️ Do not rename without updating all imports |
| `cacheTime` is correct for React Query **v4** (renamed to `gcTime` in v5) | `client/app/_layout.tsx` | ⚠️ Do not upgrade to v5 without a migration plan |
| Clerk webhook registered **twice** — once in `server.ts` and once in `routes/index.ts` | Both files | ✅ Fixed — removed duplicate from `routes/index.ts` |
| All `LOCAL_API_URL` platform branches point to the same Vercel URL | `client/config/api.ts` | ⚠️ For local dev, set `EXPO_PUBLIC_API_URL` in `client/.env` to your local server |
| `authorize` middleware returned `"success": "false"` (string, not boolean) | `server/middlewares/auth.ts` | ✅ Fixed — changed to `false` (boolean) |
| Font key `tajwal-meduim` had a typo across 5 files | `_layout.tsx`, `tailwind.config.js`, `FilterProductsModal.tsx` | ✅ Fixed — renamed to `tajwal-medium` in all 3 files |
# Contributing to Lyra (ليرة)

Thank you for contributing to Lyra. This project holds high architectural and design standards to ensure consistency across mobile, web, and back-office platforms.

Before submitting changes, please review these principles and conventions.

---

## 1. Core Architectural Invariants

### 1.1 One API, Many Clients
- All business logic lives in `server/services/`.
- Never duplicate core business logic, price calculations, or tax rules in client applications.
- Shipping fees and taxes must **never** be accepted directly from client requests.

### 1.2 Event-Sourced Inventory
- **Never mutate stock numbers directly.** Every single change to an inventory balance must be recorded through a `StockMovement`.
- Use the correct movement type:
  - `in`: Restock or purchase order arrival (`+quantity`).
  - `reserve`: Order placed, awaiting payment or shipment (`+reserved`).
  - `release`: Order cancelled or payment expired (`-reserved`).
  - `commit`: Order fulfilled and dispatched (`-quantity`, `-reserved`).
  - `transfer_out` / `transfer_in`: Inter-warehouse movement.
  - `adjust`: Manual stock audit adjustment.
- Ensure all stock mutations are wrapped in appropriate transactions via `withOptionalTransaction`.

### 1.3 Regex & Query Safety
- Every query parameter that reaches a MongoDB `$regex` must pass through `utils/escapeRegex.ts`.
- Never interpolate raw strings into regex queries on public or protected endpoints.

### 1.4 Idempotency & Replay Safety
- Order creation must provide and respect an `Idempotency-Key` header scoped to the authenticated user.

---

## 2. Design System & Frontend Guidelines

### 2.1 Arabic-First & RTL
- Every layout must respect RTL reading order (`isRTL` derived from the active language).
- Mirror navigation arrows: back arrows must point forward in RTL environments.
- Use natural text alignment per locale.

### 2.2 Palette & Contrast
- **No pure `#000000`** in text, icons, shadows, or background elements.
- Use warm charcoal (`#3C3633`) and stone tones for text.
- Use artisanal gold (`#B89354`) as an accent (jewelry, CTAs, active highlights) — never full-bleed backgrounds.
- Error alerts must use warm terracotta/coral (`#A3523B`) rather than saturated neon red.

### 2.3 Sensory Feedback
- Provide haptic feedback for key touch interactions on mobile:
  - Chip selections: `Haptics.impactAsync(Light)`
  - Add to Bag & Order Confirmation: `Haptics.notificationAsync(Success)`

---

## 3. Development & Verification Workflow

Before submitting a Pull Request or pushing to `production`, all automated checks must pass cleanly:

### Server Verification
```bash
cd server
npm test                 # Unit test suite (no database required)
npm run test:integration # In-memory MongoDB integration test suite
npx tsc --noEmit         # TypeScript compiler checks
npm run lint             # ESLint analysis
```

### Client Verification
```bash
cd client
npm run types:routes     # Generate route types
npm test                 # Permissions and admin guard tests
npx tsc --noEmit         # TypeScript compiler checks
npx eslint .             # ESLint analysis (0 errors, 0 warnings)
```

### Web Backoffice & Storefront Verification
```bash
cd admin
npm run typecheck        # tsc --noEmit
npm run build            # tsc --noEmit && vite build

cd web
npm run typecheck        # tsc --noEmit
npm run lint             # next lint (the committed .eslintrc.json is what stops
                         # this prompting for a configuration and hanging)
npm run build            # next build (requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
                         # since prerendering throws without one)
```

---

## 4. Pull Request Checklist

- [ ] All unit and integration tests pass without failures.
- [ ] TypeScript typecheck passes with zero errors on both client and server.
- [ ] Code conforms to ESLint rules with zero lint errors and zero new warnings.
- [ ] Schema changes include appropriate migrations or seeding updates if necessary.
- [ ] Security boundaries (RBAC authorization, input validation, regex escaping) are maintained.
- [ ] Relevant documentation or `AGENT.md` sections are updated.

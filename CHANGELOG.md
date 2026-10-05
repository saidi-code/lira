# Changelog

All notable changes to the Lira (ليرة) project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Comprehensive project root documentation: `README.md`, `CONTRIBUTING.md`, and `CHANGELOG.md`.
- Full admin backoffice screens in the mobile client:
  - Inventory overview, movements ledger, and low-stock monitor.
  - Suppliers management and Purchase Orders with partial receipt capabilities.
  - Warehouse transfer workflows (`draft`, `in_transit`, `completed`).
  - Staff role assignment with automatic synchronization awareness.
- CI automated route type generator (`generateRouteTypes.cjs`) providing byte-for-byte fidelity with Expo Router's dev generator in under 150ms.
- Integration test suite running against real in-memory MongoDB (`mongodb-memory-server`) covering inventory ledger, webhook signature verification, and order lifecycle transitions.
- Verification utility for Clerk webhook synchronizations (`scripts/verifyClerkSync.ts`).
- Vercel Cron compatibility for automated order sweep (`GET` + `Bearer` secret support).

### Changed
- Refactored `client/config/api.ts`, `cartApi.ts`, and `favorisApi.ts` to eliminate unused imports and resolve ESLint warnings.
- Enhanced `useAdminUsers` hook to return pagination metadata with safe fallbacks.
- Updated `useFavoris` hook dependency array to ensure reactive memoization integrity.
- Replaced stale BullMQ queue documentation with serverless-compatible Vercel Cron scheduled endpoint documentation.
- Stripped `.js` suffixes from `packages/shared` internal imports: Vite resolves them, but Next's webpack did not, so `web` failed to build.
- Added `.eslintrc.json` to `web/` so `npm run lint` runs non-interactively (without it, `next lint` prompts for a configuration and a non-interactive run hangs).

### Fixed
- Fixed phantom stock hold bugs by enforcing distinct `commit` (order fulfilled) and `out` (direct reduction) ledger movements.
- Resolved transaction session dropping bug in `receive()` and `transfer()` functions when running on standalone MongoDB setups.
- Corrected conflicting text indexes on embedded schemas in `Product` collection.
- Added strict input escaping (`escapeRegex.ts`) across all public search and filter endpoints to prevent regex injection and catastrophic backtracking.
- Fixed route guard visibility checks in client admin navigation to properly reflect server role authorizations.

---

## [1.0.0] - 2026-05-22

### Added
- Initial project scaffolding for Lira multi-client platform.
- Customer storefront mobile app built with Expo SDK 54, React Native 0.81, and NativeWind v4.
- REST API server built with Node.js, Express v5, and Mongoose v9.
- Clerk authentication integration for mobile clients and server middleware.
- Core domain models: Products, Categories, Collections, Orders, Cart, Wishlist, Addresses, and Reviews.

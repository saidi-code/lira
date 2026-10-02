// constants/roles.ts
// ==========================================
//   The role vocabulary, in one dependency-free place.
//
// This is data, not behaviour, so it deliberately imports nothing: it used to
// live in `config/adminApi.ts`, which meant the permission rules and the role
// list reached `react-native` through the HTTP client and could not be tested
// outside a bundler. `adminApi` re-exports it, so existing imports still work.
// ==========================================

/** Mirrors `USER_ROLES` in `server/models/User.ts`. */
export type UserRole =
  | "user"
  | "admin"
  | "manager"
  | "cashier"
  | "warehouse_staff";

export const USER_ROLES: readonly UserRole[] = [
  "user",
  "admin",
  "manager",
  "cashier",
  "warehouse_staff",
];
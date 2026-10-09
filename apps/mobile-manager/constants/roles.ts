// constants/roles.ts
// ==========================================
//   The role vocabulary, in one dependency-free place.
//
// This is data, not behaviour, and mirrors the server role vocabulary without
// coupling UI code to the HTTP client.
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

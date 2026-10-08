// constants/permissions.ts
// ==========================================
//   What each staff role may reach inside the backoffice.
//
// Every entry mirrors an `authorize(...)` list on a server route:
//
//   dashboard / products / orders / users          admin
//   inventory reads, transfers                     admin, manager, warehouse_staff
//   inventory adjust, POs, suppliers, warehouses   admin, manager
//
// This decides only what the app *offers* to show, so a warehouse manager is not
// sent into a screen that will 403. It is not a security boundary — `authorize`
// is, and nothing here changes it.
//
// It exists because the admin gate used to be a single `role !== "admin"` test.
// That locked out the two staff roles the server had already opened to: a
// manager could call every inventory endpoint successfully and never see one of
// them.
//
// Keep this in step with the server by reading the `router.use(protect,
// authorize(...))` lines — this is the copy, the routes are the original.
// `tests/permissions.test.ts` fails if the two disagree about which roles count
// as staff, which is the part most likely to rot.
// ==========================================
import { USER_ROLES, type UserRole } from "./roles";

export type Capability =
  | "dashboard"
  | "products"
  | "orders"
  | "inventory.read"
  | "inventory.adjust"
  | "purchasing"
  | "suppliers"
  | "warehouses"
  | "transfers"
  | "users";

export const CAPABILITY_ROLES = {
  dashboard: ["admin"],
  products: ["admin"],
  orders: ["admin"],
  "inventory.read": ["admin", "manager", "warehouse_staff"],
  "inventory.adjust": ["admin", "manager"],
  purchasing: ["admin", "manager"],
  suppliers: ["admin", "manager"],
  warehouses: ["admin", "manager"],
  transfers: ["admin", "manager", "warehouse_staff"],
  users: ["admin"],
} as const satisfies Record<Capability, readonly UserRole[]>;

/**
 * Roles that can open the backoffice at all — the union of `CAPABILITY_ROLES`.
 *
 * `cashier` is deliberately absent: it is assignable in the database and in
 * Clerk, but no route grants it anything, so sending a cashier in would land them
 * on an empty backoffice. `ROLES_WITHOUT_BACKOFFICE_ACCESS` records that, and a
 * test fails if someone grants `cashier` a capability without adding it here.
 */
export const STAFF_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "warehouse_staff",
];

/** Roles that can be assigned but reach nothing. Kept honest by a test. */
export const ROLES_WITHOUT_BACKOFFICE_ACCESS: readonly UserRole[] = [
  "user",
  "cashier",
];

/**
 * Clerk's `publicMetadata.role` is typed `unknown`, so it is checked rather than
 * cast. Fails closed: a missing, misspelt or oddly-cased role gets nothing, which
 * is the safe direction for a gate.
 */
export const normalizeRole = (raw: unknown): UserRole | null =>
  typeof raw === "string" && (USER_ROLES as readonly string[]).includes(raw)
    ? (raw as UserRole)
    : null;

export const can = (
  role: UserRole | null | undefined,
  capability: Capability
): boolean => {
  if (role == null) return false;
  return (CAPABILITY_ROLES[capability] as readonly UserRole[]).includes(role);
};

export const isStaff = (role: UserRole | null | undefined): boolean =>
  role != null && STAFF_ROLES.includes(role);
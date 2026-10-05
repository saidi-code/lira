export const USER_ROLES = [
  "user",
  "admin",
  "manager",
  "cashier",
  "warehouse_staff",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

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

export const STAFF_ROLES: readonly UserRole[] = [
  "admin",
  "manager",
  "warehouse_staff",
];

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

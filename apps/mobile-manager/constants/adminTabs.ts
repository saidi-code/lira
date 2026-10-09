// constants/adminTabs.ts
// ==========================================
//   The backoffice tab bar, as data.
//
// The tabs used to be seven hand-written `<Tabs.Screen>` blocks inside
// `app/admin/_layout.tsx`, which meant "which tabs does a manager get?" could only
// be answered by rendering the app and signing in as a manager. It is the exact
// question that was got wrong once already — the old gate was `role !== "admin"`,
// so a `manager` could call every inventory endpoint and see none of them.
//
// As data it is pure, so `tests/adminTabs.test.ts` pins the answer for all three
// staff roles without a device, a Clerk session or a simulator.
//
// This decides what is *offered*. `RequireCapability` decides what actually
// mounts, and `authorize(...)` on the server decides what succeeds — three layers,
// because the first one is the only one a user notices.
// ==========================================
import { can, type Capability } from "./permissions";
import type { UserRole } from "./roles";

export interface AdminTab {
  /** Route name inside `app/admin/`: either `<name>.tsx` or `<name>/index.tsx`. */
  name: string;
  title: string;
  capability: Capability;
}

/**
 * Order here is the order in the tab bar. `as const` keeps each `name` a literal,
 * so `TAB_ICON` in the layout is required to cover every one of them — a new tab
 * with no icon is a compile error rather than an invisible tab.
 */
export const ADMIN_TABS = [
  { name: "inventory", title: "Stock", capability: "inventory.read" },
  { name: "purchasing", title: "Buy", capability: "purchasing" },
  { name: "transfers", title: "Move", capability: "transfers" },
  { name: "announcements", title: "Notify", capability: "announcements" },
] as const satisfies readonly AdminTab[];

export type AdminTabName = (typeof ADMIN_TABS)[number]["name"];

/** The tabs a role is offered, in bar order. Pure. */
export const visibleTabNames = (
  role: UserRole | null | undefined
): AdminTabName[] =>
  ADMIN_TABS.filter((tab) => can(role, tab.capability)).map((tab) => tab.name);

/** The tooltip-ish label for a tab, for empty states and tests. */
export const tabTitle = (name: AdminTabName): string =>
  ADMIN_TABS.find((tab) => tab.name === name)?.title ?? name;

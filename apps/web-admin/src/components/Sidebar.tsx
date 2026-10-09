import { NavLink } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import { can, normalizeRole, type Capability } from "@lira/shared";

const LINKS: { to: string; label: string; capability: Capability }[] = [
  { to: "/", label: "Dashboard", capability: "dashboard" },
  { to: "/products", label: "Products", capability: "products" },
  { to: "/announcements", label: "Announcements", capability: "announcements" },
  { to: "/orders", label: "Orders", capability: "orders" },
  { to: "/inventory", label: "Inventory", capability: "inventory.read" },
  { to: "/purchasing", label: "Purchasing", capability: "purchasing" },
  { to: "/transfers", label: "Transfers", capability: "transfers" },
  { to: "/warehouses", label: "Warehouses", capability: "warehouses" },
  { to: "/staff", label: "Staff", capability: "users" },
];

export function Sidebar() {
  const { user } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role);

  return (
    <aside className="flex w-60 flex-col border-r border-primary/15 bg-white px-4 py-6">
      <p className="mb-8 px-2 font-serif text-2xl text-primary-dim">ليرة</p>
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {LINKS.filter((l) => can(role, l.capability)).map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 ${isActive ? "bg-surface-dim text-primary-dim" : "text-muted hover:bg-canvas"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center gap-2 px-2 pt-4 text-xs text-muted">
        <UserButton />
        <span>{role}</span>
      </div>
    </aside>
  );
}

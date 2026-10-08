import { useUser } from "@clerk/clerk-react";
import { can, normalizeRole, type Capability } from "@lira/shared";
import type { ReactNode } from "react";

export function RequireCapability({
  capability,
  children,
}: {
  capability: Capability;
  children: ReactNode;
}) {
  const { user } = useUser();
  const role = normalizeRole(user?.publicMetadata?.role);
  if (!can(role, capability)) {
    return <p className="text-danger">This desk is not open to your role.</p>;
  }
  return <>{children}</>;
}

// hooks/usePermissions.ts
// ==========================================
//   The signed-in user's role, and what they may open.
//
// Clerk's `publicMetadata.role` is the upstream truth — the webhook re-syncs the
// database from it on every sign-in, so a role edited only in Mongo does not
// survive. This reads Clerk for exactly that reason.
// ==========================================
import { useUser } from "@clerk/clerk-expo";

import {
  can as canDo,
  isStaff as isStaffRole,
  normalizeRole,
  type Capability,
} from "../constants/permissions";

export function usePermissions() {
  const { user, isLoaded } = useUser();

  // `publicMetadata` is typed `Record<string, unknown>`, so the value is checked
  // rather than trusted: an unrecognised role resolves to null and grants nothing.
  const role = normalizeRole(user?.publicMetadata?.role);

  return {
    /** False until Clerk has resolved the session; do not redirect on this alone. */
    isLoaded,
    role,
    isStaff: isStaffRole(role),
    can: (capability: Capability) => canDo(role, capability),
  };
}
// services/clerkUserMapper.ts
// ==========================================
// CLERK EVENT → LOCAL USER DOCUMENT
// ==========================================
// This is the only path that creates a `User`, and `protect` 401s anyone without
// one — so a crash here locks real customers out of the app entirely.
//
// It is pure on purpose. The webhook handler was previously untested because it
// needed a live Clerk secret and a database; the decisions that actually matter
// (which events count, what to do with a missing email, what a deleted user
// means) are plain data transformations and can be verified without either.
//
// The two bugs this fixes, both observed in the original handler:
//
//   1. `evt.data.email_addresses[0].email_address` threw on any account without
//      an email address. Clerk allows phone-only sign-ups, and the storefront's
//      own sign-up screen asks for a phone number — so this was reachable, and
//      the throw became a 400 that made Clerk retry the same event forever.
//   2. `first_name + ' ' + last_name` produced the literal string "null null"
//      for accounts that set neither.
// ==========================================

export interface ClerkEventLike {
  type: string;
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    username?: string | null;
    email_addresses?: { email_address: string }[];
    public_metadata?: Record<string, unknown> | null;
  };
}

/** The fields we mirror out of Clerk. */
export interface LocalUserData {
  clerkId: string;
  name: string;
  email?: string;
  image?: string;
  /** Set from Clerk's public metadata so roles need no direct database edit. */
  role?: string;
}

/** Roles accepted from Clerk metadata — mirrors `USER_ROLES` in models/User.ts. */
export const SYNCABLE_ROLES = [
  "user",
  "admin",
  "manager",
  "cashier",
  "warehouse_staff",
] as const;

/**
 * Picks a display name, degrading through full name → username → email → id.
 *
 * Never returns an empty string: `name` is required by the schema, and an empty
 * name is worse than an ugly one.
 */
export const displayName = (data: ClerkEventLike["data"]): string => {
  const full = [data.first_name, data.last_name]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .trim();

  if (full) return full;
  if (data.username?.trim()) return data.username.trim();

  const email = firstEmail(data);
  if (email) return email;

  return `user-${data.id.slice(-6)}`;
};

/** The first email address, if the account has one. */
export const firstEmail = (data: ClerkEventLike["data"]): string | undefined => {
  const list = data.email_addresses ?? [];
  return list.find((entry) => Boolean(entry?.email_address))?.email_address;
};

/**
 * Reads a role out of Clerk's public metadata, ignoring anything unrecognised.
 *
 * Silently ignoring is deliberate: metadata is editable from the Clerk dashboard,
 * and a typo there must not make the sync throw and strand the user's account in
 * a half-created state.
 */
export const roleFromMetadata = (
  metadata: ClerkEventLike["data"]["public_metadata"]
): string | undefined => {
  const role = metadata?.role;
  if (typeof role !== "string") return undefined;
  return (SYNCABLE_ROLES as readonly string[]).includes(role) ? role : undefined;
};

export type SyncAction =
  | { kind: "upsert"; data: LocalUserData }
  | { kind: "delete"; clerkId: string }
  | { kind: "ignore"; reason: string };

/**
 * Decides what a Clerk event means for the local user.
 *
 * `user.deleted` is handled because the original ignored it, which left a live
 * local document behind for an account that no longer exists.
 */
export const planForClerkEvent = (evt: ClerkEventLike): SyncAction => {
  if (evt.type === "user.deleted") {
    return { kind: "delete", clerkId: evt.data.id };
  }

  if (evt.type !== "user.created" && evt.type !== "user.updated") {
    return { kind: "ignore", reason: `unhandled event: ${evt.type}` };
  }

  const data: LocalUserData = {
    clerkId: evt.data.id,
    name: displayName(evt.data),
  };

  // Optional rather than required: a phone-only account is valid, and the schema
  // treats email as a sparse unique index precisely so it can be absent.
  const email = firstEmail(evt.data);
  if (email) data.email = email;

  if (evt.data.image_url) data.image = evt.data.image_url;

  const role = roleFromMetadata(evt.data.public_metadata);
  if (role) data.role = role;

  return { kind: "upsert", data };
};
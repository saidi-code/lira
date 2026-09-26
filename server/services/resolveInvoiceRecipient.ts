// services/resolveInvoiceRecipient.ts
// ==================== RESOLVE THE REAL RECIPIENT ====================
import { clerkClient } from "@clerk/express";
import type { InvoiceRecipient } from "../types/invoice.js";

/** Minimal shape of the local user doc we keep as a fallback. */
export interface LocalUserRef {
  clerkId?: string;
  name?: string;
  email?: string;
}

/** Joins whatever name parts Clerk has into a single display string. */
const joinName = (
  first: string | null | undefined,
  last: string | null | undefined
): string => [first, last].filter(Boolean).join(" ").trim();

/**
 * Picks the best email on the Clerk user.
 *
 * `primaryEmailAddress` is what the user designated as primary; we only fall
 * back to the raw list when it is absent, and we skip unverified addresses so
 * we never post an invoice to an address the customer never proved they own.
 */
const pickEmail = (user: {
  primaryEmailAddress?: { emailAddress?: string } | null;
  emailAddresses?: {
    emailAddress?: string;
    verification?: { status?: string } | null;
  }[];
}): string | undefined => {
  const primary = user.primaryEmailAddress?.emailAddress?.trim();
  if (primary) return primary;

  return user.emailAddresses?.find(
    (e) => e?.emailAddress && e.verification?.status === "verified"
  )?.emailAddress?.trim();
};

/**
 * Resolves the real authenticated user for an invoice email.
 *
 * Clerk is the authentication source of truth, so we ask the Clerk Backend API
 * for the live record. The local `users` document is only a cache written by a
 * webhook, which can be stale (missed event, changed email not yet synced) or
 * in rare cases missing entirely — sending an invoice to a stale address is
 * worse than asking the authority.
 *
 * Falls back to the cached local values so a Clerk outage degrades to
 * last-known-good rather than dropping the invoice.
 */
export const resolveInvoiceRecipient = async (
  clerkUserId: string | undefined | null,
  fallback?: LocalUserRef
): Promise<InvoiceRecipient> => {
  if (clerkUserId) {
    try {
      const user = await clerkClient.users.getUser(clerkUserId);
      const email = pickEmail(user);
      const name =
        joinName(user.firstName, user.lastName) || user.username || "";

      if (email) {
        return { email, name: name || fallback?.name || "عميلنا العزيز" };
      }

      console.warn(
        "[invoice] Clerk user has no usable email, falling back to local record:",
        clerkUserId
      );
    } catch (error) {
      console.warn(
        "[invoice] Clerk lookup failed, falling back to local record:",
        clerkUserId,
        error instanceof Error ? error.message : error
      );
    }
  }

  return {
    email: fallback?.email ?? "",
    name: fallback?.name || "عميلنا العزيز",
  };
};

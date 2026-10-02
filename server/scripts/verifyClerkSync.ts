// scripts/verifyClerkSync.ts
// ==========================================
//   npm run verify:clerk-sync                    the 5 most recent accounts
//   npm run verify:clerk-sync -- --recent 15     only those synced in 15 minutes
//   npm run verify:clerk-sync -- --clerk-id user_abc   check one account
//
// Answers the only question the Clerk webhook leaves open: did a delivery arrive
// and actually create the local `User`? `protect` looks users up by `clerkId`, so
// a webhook that never lands is not a degraded experience — it is every customer
// locked out with "user not found in database".
//
// This exists because the signature check can be proven locally but a *live*
// delivery cannot: the crypto, the secret and every rejection path are covered by
// tests, and what remains is whether Clerk's own request reaches the server
// through whatever proxy sits in front of it. That can only be answered by
// sending one real event and looking at the database. This is the looking.
//
// Read-only, always. It connects with `autoIndex: false` so that checking the
// sync cannot itself change anything.
// ==========================================
import "dotenv/config";
import mongoose from "mongoose";

import { resolveDbUri } from "../config/db.js";
import User from "../models/User.js";
import { isDirectRun } from "../utils/isDirectRun.js";

export interface SyncedUser {
  clerkId?: string;
  name?: string;
  email?: string;
  role?: string;
  // `IUser` types this as `string`, while a plain `Date` is what a freshly
  // constructed row carries. Both go through `new Date(...)` below, so accept
  // either rather than fighting the model's declared type.
  createdAt?: Date | string;
}

/** Whether a row was written within `minutes` of `now`. Pure. */
export const syncedWithin = (
  user: SyncedUser,
  minutes: number,
  now: Date = new Date()
): boolean => {
  if (!user.createdAt) return false;
  return now.getTime() - new Date(user.createdAt).getTime() <= minutes * 60_000;
};

/** One aligned line per account. Pure, so the layout is unit-tested. */
export const formatUser = (user: SyncedUser): string => {
  const when = user.createdAt
    ? new Date(user.createdAt).toISOString().replace("T", " ").slice(0, 19)
    : "(no timestamp)";
  // A phone-only account has no email, which is normal rather than a fault.
  const contact = user.email ?? "(phone-only, no email)";
  return `${when}  ${(user.role ?? "?").padEnd(16)} ${(user.clerkId ?? "?").padEnd(24)} ${user.name ?? "?"} <${contact}>`;
};

export interface VerifyOptions {
  recentMinutes?: number;
  clerkId?: string;
  log?: (message: string) => void;
}

export interface VerifyResult {
  total: number;
  matched: SyncedUser[];
  /** True when a specific account was asked for and not found. */
  missing: boolean;
}

export const verifyClerkSync = async ({
  recentMinutes,
  clerkId,
  log = console.log,
}: VerifyOptions = {}): Promise<VerifyResult> => {
  const total = await User.countDocuments();

  const query = clerkId ? { clerkId } : {};
  const rows = await User.find(query)
    .select("clerkId name email role createdAt")
    .sort({ createdAt: -1 })
    .limit(clerkId ? 1 : 5)
    .lean();

  if (clerkId) {
    if (rows.length === 0) {
      log(`No local account for clerkId "${clerkId}".`);
      log(
        "\nThe webhook has not created it. Check, in this order: the endpoint is\n" +
          "registered in Clerk, CLERK_WEBHOOK_SIGNING_SECRET is set on the server\n" +
          "that receives it, and the delivery shows as 2xx in Clerk's Webhooks log."
      );
      return { total, matched: [], missing: true };
    }
    log(`Found the local account for "${clerkId}":\n`);
    for (const row of rows) log(`  ${formatUser(row)}`);
    return { total, matched: rows, missing: false };
  }

  const matched =
    recentMinutes === undefined
      ? rows
      : rows.filter((row) => syncedWithin(row, recentMinutes));

  log(`users collection: ${total} account(s).\n`);

  if (matched.length === 0) {
    log(
      recentMinutes === undefined
        ? "No accounts at all — the webhook has never created one."
        : `No account synced in the last ${recentMinutes} minute(s).\n\n` +
            "If you just sent a test event, it did not land. Check Clerk's Webhooks\n" +
            "log for the response status: a 400 means the signature check refused it."
    );
    return { total, matched: [], missing: false };
  }

  log(
    recentMinutes === undefined
      ? "Most recent accounts:"
      : `Synced in the last ${recentMinutes} minute(s):`
  );
  for (const row of matched) log(`  ${formatUser(row)}`);

  return { total, matched, missing: false };
};

/** `--recent 15` / `--clerk-id user_abc` */
const readFlag = (name: string): string | undefined => {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
};

const main = async () => {
  await mongoose.connect(resolveDbUri(), { autoIndex: false });

  const recent = readFlag("recent");
  const clerkId = readFlag("clerk-id");

  let exitCode = 0;
  try {
    const result = await verifyClerkSync({
      ...(recent !== undefined ? { recentMinutes: Number(recent) } : {}),
      ...(clerkId !== undefined ? { clerkId } : {}),
    });
    // Exit 2 so a check can tell "nothing arrived" from "arrived" without
    // parsing the output.
    exitCode = result.missing || result.matched.length === 0 ? 2 : 0;
  } finally {
    await mongoose.connection.close();
  }

  process.exit(exitCode);
};

// Only run when executed directly, so importing this for a test is inert.
if (isDirectRun("verifyClerkSync")) {
  main().catch(async (error) => {
    console.error("verify:clerk-sync failed:", error);
    await mongoose.connection.close().catch(() => undefined);
    process.exit(1);
  });
}
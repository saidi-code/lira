// tests/verifyClerkSync.test.ts
// ==========================================
// The formatting and windowing behind `npm run verify:clerk-sync`.
//
// This script is how a live Clerk delivery gets confirmed, so its output is read
// by a human deciding whether the webhook works. A row printed as recent when it
// is not — or an account hidden because a phone-only user has no email — would
// make the tool lie at exactly the moment it is being trusted.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatUser,
  syncedWithin,
  type SyncedUser,
} from "../scripts/verifyClerkSync.js";

const now = new Date("2026-10-02T12:00:00.000Z");

const minutesAgo = (minutes: number) =>
  new Date(now.getTime() - minutes * 60_000);

const user = (over: Partial<SyncedUser> = {}): SyncedUser => ({
  clerkId: "user_2abcXYZ",
  name: "Amira Benali",
  email: "amira@example.com",
  role: "user",
  createdAt: minutesAgo(1),
  ...over,
});

describe("syncedWithin", () => {
  it("counts a row written inside the window", () => {
    assert.equal(syncedWithin(user({ createdAt: minutesAgo(5) }), 15, now), true);
  });

  it("excludes a row written before it", () => {
    assert.equal(syncedWithin(user({ createdAt: minutesAgo(20) }), 15, now), false);
  });

  it("includes the boundary", () => {
    assert.equal(syncedWithin(user({ createdAt: minutesAgo(15) }), 15, now), true);
  });

  it("is false when the row has no timestamp", () => {
    // Better to omit a row than to claim it just arrived.
    assert.equal(syncedWithin({ clerkId: "u" }, 15, now), false);
  });
});

describe("formatUser", () => {
  it("shows the fields an operator needs to identify the account", () => {
    const line = formatUser(user());

    assert.match(line, /user_2abcXYZ/);
    assert.match(line, /Amira Benali/);
    assert.match(line, /amira@example\.com/);
    assert.match(line, /2026-10-02 11:59:00/);
  });

  it("labels a phone-only account rather than looking broken", () => {
    // Clerk permits phone-only signups and the schema makes `email` optional, so
    // an absent email is normal — not evidence of a failed sync.
    const line = formatUser(user({ email: undefined }));

    assert.match(line, /phone-only/);
    assert.doesNotMatch(line, /undefined/);
  });

  it("never prints the literal undefined", () => {
    const line = formatUser({});

    assert.doesNotMatch(line, /undefined/);
    assert.doesNotMatch(line, /Invalid Date/);
  });

  it("keeps the role visible, since it decides what the account can reach", () => {
    assert.match(formatUser(user({ role: "warehouse_staff" })), /warehouse_staff/);
  });
});
// tests/clerkWebhook.test.ts
// ==========================================
// The Clerk event mapping.
//
// This is the only code that creates a `User`, and `protect` rejects anyone it
// cannot find by `clerkId` — so a crash here does not degrade the app, it locks
// real customers out of it. The bugs below were all in the original handler.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  displayName,
  firstEmail,
  planForClerkEvent,
  roleFromMetadata,
  type ClerkEventLike,
} from "../services/clerkUserMapper.js";

/** A deep-partial override: `data.id` must not be restated by every test. */
type EventOverride = {
  type?: string;
  data?: Partial<ClerkEventLike["data"]>;
};

const event = (over: EventOverride = {}): ClerkEventLike => ({
  type: over.type ?? "user.created",
  data: {
    id: "user_2abcXYZ",
    first_name: "Amira",
    last_name: "Benali",
    image_url: "https://img.clerk.com/a.png",
    email_addresses: [{ email_address: "amira@example.com" }],
    ...over.data,
  },
});

const upsertOf = (over: EventOverride = {}) => {
  const plan = planForClerkEvent(event(over));
  assert.equal(plan.kind, "upsert");
  return plan.kind === "upsert" ? plan.data : undefined;
};

describe("firstEmail", () => {
  it("finds the address", () => {
    assert.equal(
      firstEmail({ id: "u", email_addresses: [{ email_address: "a@b.co" }] }),
      "a@b.co"
    );
  });

  it("is undefined for a phone-only account", () => {
    // The original handler did `email_addresses[0].email_address` and threw here.
    assert.equal(firstEmail({ id: "u", email_addresses: [] }), undefined);
    assert.equal(firstEmail({ id: "u" }), undefined);
  });

  it("skips an empty entry rather than trusting the first slot", () => {
    assert.equal(
      firstEmail({
        id: "u",
        email_addresses: [
          { email_address: "" },
          { email_address: "real@b.co" },
        ],
      }),
      "real@b.co"
    );
  });
});

describe("displayName", () => {
  it("uses the full name", () => {
    assert.equal(displayName(event().data), "Amira Benali");
  });

  it("does not produce 'null null'", () => {
    // `first_name + ' ' + last_name` with both null gave the literal "null null",
    // which then became a customer's real display name.
    assert.equal(
      displayName({ id: "user_ABCDEF", first_name: null, last_name: null }),
      "user-ABCDEF"
    );
  });

  it("uses whichever name part exists", () => {
    assert.equal(displayName({ id: "u", first_name: "Amira", last_name: null }), "Amira");
    assert.equal(displayName({ id: "u", first_name: null, last_name: "Benali" }), "Benali");
  });

  it("falls back to the username", () => {
    assert.equal(
      displayName({ id: "u", first_name: null, last_name: null, username: "amira_b" }),
      "amira_b"
    );
  });

  it("falls back to the email before the id", () => {
    assert.equal(
      displayName({
        id: "u",
        email_addresses: [{ email_address: "amira@example.com" }],
      }),
      "amira@example.com"
    );
  });

  it("never returns an empty string", () => {
    // `name` is required by the schema; an empty name is worse than an ugly one.
    assert.ok(displayName({ id: "user_ABCDEF" }).length > 0);
  });
});

describe("roleFromMetadata", () => {
  it("accepts a known role", () => {
    assert.equal(roleFromMetadata({ role: "manager" }), "manager");
    assert.equal(roleFromMetadata({ role: "warehouse_staff" }), "warehouse_staff");
  });

  it("ignores an unknown role rather than throwing", () => {
    // Metadata is editable from the Clerk dashboard; a typo there must not make
    // the sync fail and strand the account half-created.
    assert.equal(roleFromMetadata({ role: "superuser" }), undefined);
    assert.equal(roleFromMetadata({ role: 42 }), undefined);
  });

  it("is undefined when no metadata exists", () => {
    assert.equal(roleFromMetadata(null), undefined);
    assert.equal(roleFromMetadata(undefined), undefined);
  });
});

describe("planForClerkEvent", () => {
  it("upserts on create and update", () => {
    assert.equal(planForClerkEvent(event({ type: "user.created" })).kind, "upsert");
    assert.equal(planForClerkEvent(event({ type: "user.updated" })).kind, "upsert");
  });

  it("carries the profile across", () => {
    assert.deepEqual(upsertOf(), {
      clerkId: "user_2abcXYZ",
      name: "Amira Benali",
      email: "amira@example.com",
      image: "https://img.clerk.com/a.png",
    });
  });

  it("omits email entirely for a phone-only account", () => {
    const data = upsertOf({ data: { email_addresses: [] } });
    assert.equal(data?.email, undefined);
    assert.equal(data?.clerkId, "user_2abcXYZ");
  });

  it("syncs a role from public metadata", () => {
    assert.equal(
      upsertOf({ data: { public_metadata: { role: "cashier" } } })?.role,
      "cashier"
    );
  });

  it("omits the role when metadata carries none", () => {
    // The handler must be able to leave a database-assigned role alone.
    assert.equal(upsertOf()?.role, undefined);
  });

  it("deletes on user.deleted", () => {
    // Previously ignored, which left a live document for an account that no
    // longer existed.
    const plan = planForClerkEvent(event({ type: "user.deleted" }));
    assert.equal(plan.kind, "delete");
    assert.equal(
      plan.kind === "delete" ? plan.clerkId : "",
      "user_2abcXYZ"
    );
  });

  it("ignores event types it has no use for", () => {
    for (const type of [
      "session.created",
      "email.created",
      "organizationMembership.created",
    ]) {
      assert.equal(planForClerkEvent(event({ type })).kind, "ignore");
    }
  });

  it("survives a payload with nothing in it", () => {
    // Defensive: whatever Clerk sends, this must not throw — a throw becomes a
    // 400, which makes Clerk retry the same event forever.
    assert.doesNotThrow(() => planForClerkEvent({ type: "user.created", data: { id: "u" } }));
  });
});
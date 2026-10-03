// tests/webhook.integration.test.ts
// ==========================================
// THE CLERK SYNC, AGAINST A REAL MONGODB
// ==========================================
// The unit tests prove the *mapping* — what a Clerk event should turn into. They
// say nothing about whether the write works: whether the upsert really is
// idempotent, whether a phone-only account can exist given a sparse unique
// index, whether a delete actually removes the document `protect` looks up.
//
// This is the highest-stakes path in the codebase. `protect` rejects anyone it
// cannot find by `clerkId`, so if this is wrong the failure mode is not a bug
// report — it is every customer permanently locked out of the shop.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import User, { USER_ROLES } from "../../models/User.js";
import {
  applyUserPlan,
  planForClerkEvent,
  type ClerkEventLike,
  type UserWriter,
} from "../../services/clerkUserMapper.js";

let mongod: MongoMemoryServer;

/** The real writer — the same one the handler passes. */
const writer: UserWriter = {
  upsert: (data) =>
    User.findOneAndUpdate(
      { clerkId: data.clerkId },
      { $set: data },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        // Without this the write skips validation entirely, and a typo in
        // Clerk's `publicMetadata.role` — "manage", "adminn" — would be stored
        // happily. `authorize` checks against `USER_ROLES`, so that user would
        // then be refused by every staff route with no explanation anywhere.
        runValidators: true,
      }
    ),
  remove: (clerkId) => User.deleteOne({ clerkId }),
};

const sync = (evt: ClerkEventLike) =>
  applyUserPlan(planForClerkEvent(evt), writer);

const event = (over: {
  type?: string;
  data?: Partial<ClerkEventLike["data"]>;
} = {}): ClerkEventLike => ({
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

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Index build is asynchronous, and a test that races it finds no unique
  // constraint on `email` — which would quietly turn "one document per email"
  // into an untested claim. `Model.init()` resolves once the indexes exist.
  await User.init();
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  );
});
describe("the Clerk sync against a real database", () => {
  it("creates the user a protected route needs", async () => {
    await sync(event());

    const user = await User.findOne({ clerkId: "user_2abcXYZ" }).lean();
    assert.ok(user, "the document exists");
    assert.equal(user?.name, "Amira Benali");
    assert.equal(user?.email, "amira@example.com");
    assert.equal(user?.role, "user", "the default role");
  });

  it("creates a phone-only account, which has no email at all", async () => {
    // The bug this pins: `email_addresses[0].email_address` threw on these, and
    // a throw becomes a 400, which makes Clerk retry forever — so the customer
    // is never created and `protect` 401s them permanently.
    await sync(
      event({ data: { email_addresses: [], first_name: null, last_name: null } })
    );

    const user = await User.findOne({ clerkId: "user_2abcXYZ" }).lean();
    assert.ok(user, "a user with no email can exist");
    assert.equal(user?.email, undefined);
    assert.ok(user?.name, "and still has a name to show");
  });

  it("is idempotent under Clerk's retries", async () => {
    // The handler used to find-then-create: a retry landing between the read
    // and the write would create a second document.
    await sync(event());
    await sync(event());
    await sync(event());

    assert.equal(await User.countDocuments(), 1, "one document, not three");
  });

  it("updates in place rather than duplicating on a changed name", async () => {
    await sync(event());
    await sync(event({ data: { first_name: "Amira", last_name: "Zouari" } }));

    const users = await User.find().lean();
    assert.equal(users.length, 1);
    assert.equal(users[0]?.name, "Amira Zouari");
  });

  it("enforces one document per email", async () => {
    // Two Clerk accounts claiming the same address must not both land, or
    // `protect` would find whichever sorted first.
    await sync(event());
    await assert.rejects(() =>
      sync(
        event({
          data: {
            id: "user_OTHER",
            email_addresses: [{ email_address: "amira@example.com" }],
          },
        })
      )
    );
  });

  it("syncs a role from public metadata", async () => {
    await sync(event({ data: { public_metadata: { role: "manager" } } }));

    const user = await User.findOne().lean();
    assert.equal(user?.role, "manager");
    assert.ok((USER_ROLES as readonly string[]).includes(user?.role ?? ""));
  });

  it("leaves a database-assigned role alone when metadata carries none", async () => {
    await sync(event());
    await User.updateOne({}, { $set: { role: "admin" } });

    await sync(event({ data: { first_name: "Amira", last_name: "B." } }));

    const user = await User.findOne().lean();
    assert.equal(
      user?.role,
      "admin",
      "a promotion must not be undone by the next sign-in"
    );
  });

  it("ignores a role the schema does not know", async () => {
    // Clerk's `publicMetadata` is hand-edited in a dashboard, so a typo here
    // ("manage", "adminn") is likely rather than exotic. The mapper drops it
    // rather than throwing: a 400 would make Clerk retry the same event forever,
    // and a customer who cannot sign in because of a dashboard typo is a far
    // worse outcome than a user who is simply not a manager.
    await sync(event({ data: { public_metadata: { role: "superuser" } } }));

    const user = await User.findOne().lean();
    assert.ok(user, "the account still gets created");
    assert.equal(
      user?.role,
      "user",
      "defaulting to the least-privileged role, never the bad one"
    );
  });

  it("removes the user on user.deleted", async () => {
    // Previously ignored, leaving a live document for an account that no longer
    // exists — so `protect` kept matching a user who could not sign in.
    await sync(event());
    assert.equal(await User.countDocuments(), 1);

    await sync(event({ type: "user.deleted" }));
    assert.equal(await User.countDocuments(), 0, "gone");
  });

  it("tolerates deleting an account it never saw", async () => {
    // A delete arriving before any create must not throw — that would be a 400,
    // and Clerk would retry it forever.
    await assert.doesNotReject(() => sync(event({ type: "user.deleted" })));
  });

  it("does nothing for an event it has no use for", async () => {
    await sync(event({ type: "session.created" }));
    assert.equal(await User.countDocuments(), 0);
  });

  it("survives a payload stripped of everything optional", async () => {
    await assert.doesNotReject(() =>
      sync({ type: "user.created", data: { id: "user_BARE" } })
    );

    const user = await User.findOne({ clerkId: "user_BARE" }).lean();
    assert.ok(user?.name, "still got a name");
  });
});
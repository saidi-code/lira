// tests/webhookSignature.integration.test.ts
// ==========================================
// THE CLERK WEBHOOK SIGNATURE CHECK, OVER REAL HTTP AND A REAL DATABASE
// ==========================================
// `webhook.integration.test.ts` covers the mapping and the write. It says nothing
// about the layer in front of them: whether an *unsigned* or *forged* payload can
// reach that write at all.
//
// That is the whole security boundary for this route. The endpoint is public —
// there is no `protect` on it, because Clerk cannot hold a user session — so the
// signature is the only thing separating "Clerk says this user signed up" from
// "anyone on the internet says this user signed up, as an admin".
//
// `verifyWebhook()` is called with the real handler and the real Express
// middleware ordering from `server.ts`, over a real socket. Nothing here is
// stubbed: a bug in the wiring — a missing header check, a body consumed before
// the raw parser, a verification skipped when configuration is absent — only
// appears when all three compose.
//
// Verified behaviour, all fail-closed: a tampered body, a foreign secret, absent
// headers, a replayed timestamp, a missing env secret, and a non-base64 secret
// each produce 400 and write nothing.
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, describe, it } from "node:test";
import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Webhook } from "standardwebhooks";

import clerkWebhook from "../controllers/webhooks.js";
import User from "../models/User.js";

let mongod: MongoMemoryServer;
let httpServer: Server;
let baseUrl: string;

/**
 * Generated per run, never read from `.env`. CI must not depend on a developer's
 * real Clerk secret, and a committed one would be a live credential in git.
 */
const SECRET = `whsec_${Buffer.from(
  webcrypto.getRandomValues(new Uint8Array(32))
).toString("base64")}`;

const otherSecret = () =>
  `whsec_${Buffer.from(webcrypto.getRandomValues(new Uint8Array(32))).toString(
    "base64"
  )}`;

/** The middleware order from `server.ts`, reproduced exactly. */
const buildApp = () => {
  const app = express();
  // Raw body BEFORE `express.json()`: the signature is computed over the exact
  // bytes Clerk sent, so the body must reach the handler unparsed and unmodified.
  app.post(
    "/api/v1/clerk",
    express.raw({ type: "application/json" }),
    clerkWebhook
  );
  app.use(express.json());
  return app;
};

const payloadFor = (id: string, over: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: "user.created",
    data: {
      id,
      first_name: "Amira",
      last_name: "Benali",
      email_addresses: [{ email_address: `${id}@example.com` }],
      ...over,
    },
  });

/** Headers Clerk's provider sends, signed the way Clerk's provider signs them. */
const signed = (
  body: string,
  {
    secret = SECRET,
    when = new Date(),
    id = "msg_1",
  }: { secret?: string; when?: Date; id?: string } = {}
) => {
  const webhook = new Webhook(secret);
  return {
    "svix-id": id,
    "svix-timestamp": String(Math.floor(when.getTime() / 1000)),
    "svix-signature": webhook.sign(id, when, body),
  };
};

const post = (
  body: string,
  headers: Record<string, string>,
  contentType = "application/json"
) =>
  fetch(`${baseUrl}/api/v1/clerk`, {
    method: "POST",
    headers: { "content-type": contentType, ...headers },
    body,
  });

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await User.init();

  // Port 0: an ephemeral port, so a parallel run cannot collide.
  httpServer = buildApp().listen(0);
  await new Promise((resolve) => httpServer.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  );
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = SECRET;
});

describe("the Clerk webhook signature check", () => {
  it("accepts a correctly signed payload and creates the user", async () => {
    // The one case that proves the whole chain: signature -> mapping -> database.
    // If this fails, nothing else in the suite means anything.
    const body = payloadFor("user_sig_ok");

    const res = await post(body, signed(body));

    assert.equal(res.status, 200);
    const user = await User.findOne({ clerkId: "user_sig_ok" }).lean();
    assert.ok(user, "the signature was trusted, so the write happened");
    assert.equal(user?.email, "user_sig_ok@example.com");
  });

  it("rejects a tampered body that reuses the original signature", async () => {
    // The attack this endpoint exists to stop: keep a signature Clerk really
    // produced, swap the body for one that grants a role. A handler that verifies
    // the *presence* of a signature, or verifies the wrong variable, lets this
    // through — and the payload below would create a manager account.
    const original = payloadFor("user_victim");
    const forged = payloadFor("user_victim", {
      public_metadata: { role: "manager" },
    });

    const res = await post(forged, signed(original));

    assert.equal(
      res.status,
      400,
      "a signature over different bytes must be refused"
    );
    assert.equal(await User.countDocuments(), 0, "and must write nothing");
  });

  it("rejects a signature produced with a different secret", async () => {
    const body = payloadFor("user_foreign");

    const res = await post(body, signed(body, { secret: otherSecret() }));

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects a request carrying no signature headers at all", async () => {
    const res = await post(payloadFor("user_bare"), {});

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects a replayed signature whose timestamp is ten minutes old", async () => {
    // Without the tolerance check a captured request is valid forever, so an
    // old payload could be replayed at will.
    const body = payloadFor("user_old");
    const res = await post(
      body,
      signed(body, { when: new Date(Date.now() - 10 * 60 * 1000) })
    );

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects everything when the signing secret is unset, rather than trusting the payload", async () => {
    // The most dangerous possible bug in this file: if verification were skipped
    // whenever configuration was missing, then any deployment that lost this env
    // var — a bad deploy, a rotated secret, a typo'd variable name — would accept
    // unsigned payloads from anyone. It throws instead, and the handler's catch
    // turns that into a 400.
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    const body = payloadFor("user_unconfigured");

    const res = await post(body, signed(body));

    assert.equal(
      res.status,
      400,
      "an unverifiable payload must never be trusted"
    );
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects an unsigned payload when the signing secret is unset", async () => {
    delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    const res = await post(payloadFor("user_unconfigured_2"), {});

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects a secret that is not valid base64", async () => {
    // `new Webhook(secret)` decodes the secret, so a truncated or corrupt value
    // throws on every request. Every webhook Clerk sends is then refused — the
    // failure is safe but total: no customer is ever created locally, and
    // `protect` refuses them afterwards. Pinned so it is never mistaken for a
    // Clerk outage.
    process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_not-valid-base64!!!";
    const body = payloadFor("user_badsecret");

    const res = await post(body, signed(body));

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  it("rejects a body the raw parser never saw", async () => {
    // A proxy or client sending another content-type leaves `req.body` unset, so
    // the handler ends up verifying the empty string. It must refuse rather than
    // fall back to trusting the parsed body.
    const body = payloadFor("user_ctype");

    const res = await post(body, signed(body), "text/plain");

    assert.equal(res.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });
});

describe("the route's position in the middleware stack", () => {
  it("needs the raw parser mounted before express.json()", async () => {
    // `server.ts` registers this route above `app.use(express.json())`, and the
    // ordering is load-bearing. Reproduced backwards here to show why: a parsed
    // body is re-serialised by `JSON.stringify`, which is not guaranteed to
    // reproduce the bytes Clerk signed.
    //
    // A pretty-printed body is used deliberately. Re-serialising collapses the
    // indentation, so the mismatch is certain. A compact body can survive by luck,
    // since `JSON.stringify` tends to rebuild the same key order — which is
    // exactly why this must not be left to chance.
    const app = express();
    app.use(express.json());
    app.post(
      "/api/v1/clerk",
      express.raw({ type: "application/json" }),
      clerkWebhook
    );
    const misordered = app.listen(0);
    await new Promise((resolve) => misordered.once("listening", resolve));
    const { port } = misordered.address() as AddressInfo;

    try {
      const body = JSON.stringify(JSON.parse(payloadFor("user_order")), null, 2);
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/clerk`, {
        method: "POST",
        headers: { "content-type": "application/json", ...signed(body) },
        body,
      });

      assert.equal(
        res.status,
        400,
        "parsing the body first breaks verification — keep the route above express.json()"
      );
    } finally {
      await new Promise((resolve) => misordered.close(resolve));
    }
  });
});
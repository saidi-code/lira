// tests/errorHandler.test.ts
// ==========================================
//   What a thrown error becomes on the wire.
//
// The mapping used to be 61 hand-written `status(500).json({ message:
// error.message })` blocks, ten of which sent Mongoose's own message to the
// client. This pins the replacement, with two properties that are easy to lose in
// a refactor and impossible to notice in review:
//
//   1. **Nothing internal reaches the client.** A CastError message names the
//      collection and field path; a ValidationError message describes our schema.
//   2. **The status is right.** A malformed id is the caller's mistake (400), a
//      duplicate is a conflict (409), and only our own faults are 500.
//
// The response half runs through a real `express` app over a real socket, so it
// also proves the middleware is wired in the shape Express recognises: an error
// handler that loses a parameter is arity-3 and silently never runs.
// ==========================================
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import {
  AppError,
  errorHandler,
  notFoundHandler,
  normalizeError,
} from "../middlewares/errorHandler.js";

/**
 * The installed Express major, read from node_modules rather than hard-coded.
 *
 * Only Express 5 forwards a rejected promise from an async handler to the error
 * middleware. On Express 4 the same handler leaves the request hanging until it
 * times out, with no error anywhere — and 63 of our handlers have no `next`, so
 * all of them depend on this. It changes silently on an upgrade, which is why it
 * is asserted rather than assumed.
 */
// `__dirname` does not exist here: the package is `"type": "module"`, so this
// resolves from import.meta.url instead.
const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const expressMajor = Number(
  JSON.parse(
    readFileSync(path.join(serverRoot, "node_modules", "express", "package.json"), "utf8")
  ).version.split(".")[0]
);
const STOCK_MESSAGE = "Product.stock validation failed: 3 is less than minimum 0";

/**
 * A real ValidationError, shaped the way Mongoose builds one.
 *
 * `message` and `errors` are both assigned: Mongoose sets `message` to the bare
 * "Validation failed" in its constructor and only fills `errors` as paths fail,
 * so a fixture that sets one but not the other describes something the driver
 * never produces — and `normalizeError` reads both.
 */
const validationError = (): mongoose.Error.ValidationError => {
  const error = new mongoose.Error.ValidationError();
  const shaped = error as unknown as {
    message: string;
    errors: Record<string, { message: string; properties: object }>;
  };
  shaped.errors = { stock: { message: STOCK_MESSAGE, properties: {} } };
  shaped.message = STOCK_MESSAGE;
  return error;
};

/** A driver-level duplicate key, which is not a ValidationError. */
const duplicateKey = () =>
  Object.assign(new Error("E11000 duplicate key"), {
    code: 11000,
    keyPattern: { email: 1 },
  });

describe("normalizeError", () => {
  it("turns a malformed id into a 400 naming the field", () => {
    const { status, expose } = normalizeError(
      new mongoose.Error.CastError("ObjectId", "not-an-id", "_id")
    );

    assert.equal(status, 400);
    // Naming the field is what lets a caller fix it without guessing.
    assert.match(expose, /_id/);
  });

  it("turns a schema violation into a 400, not a 500", () => {
    const { status, expose, internal } = normalizeError(validationError());

    assert.equal(status, 400);
    // The single message is useful; Mongoose's combined blob is a schema dump.
    assert.equal(expose, STOCK_MESSAGE);
    // …and it is still logged for us.
    assert.match(internal, /Product\.stock/);
  });

  it("turns a duplicate key into a 409", () => {
    const { status, expose } = normalizeError(duplicateKey());

    // 500 here told the client "server broke", so retrying forever got the same
    // opaque answer. 409 is the truth: the write conflicts with an existing row.
    assert.equal(status, 409);
    assert.match(expose, /already exists/i);
  });

  it("turns malformed JSON into a 400", () => {
    const parseError = Object.assign(new SyntaxError("Unexpected token }"), {
      body: "{ nope",
    });

    assert.equal(normalizeError(parseError).status, 400);
  });

  it("hides everything about an unexpected error", () => {
    const { status, expose, internal } = normalizeError(
      new Error("MongoServerError: connection <monitor> to 10.0.3.4:27017 timed out")
    );

    assert.equal(status, 500);
    // The host and port of our database cluster must not be in a response body.
    assert.doesNotMatch(expose, /10\.0\.3\.4/);
    assert.doesNotMatch(expose, /timeout/i);
    assert.doesNotMatch(expose, /Mongo/);
    // But the log keeps it, or the 500 would be undebuggable.
    assert.match(internal, /10\.0\.3\.4/);
  });

  it("survives being handed something that is not an error", () => {
    for (const thrown of [undefined, null, "a string", 42, { weird: true }]) {
      const { status, expose } = normalizeError(thrown);
      assert.equal(status, 500, `thrown ${String(thrown)} should be a 500`);
      assert.equal(typeof expose, "string");
    }
  });

  it("survives a value JSON.stringify cannot serialise", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    // The fallback must not itself throw: a logger that throws while handling an
    // error loses the original one, the worst possible outcome here.
    assert.doesNotThrow(() => normalizeError(circular));
  });

  it("passes an AppError through with the status it was raised with", () => {
    const { status, expose } = normalizeError(
      new AppError("That product has variants", { status: 409 })
    );

    assert.equal(status, 409);
    assert.equal(expose, "That product has variants");
  });

  it("recognises an AppError that crossed a module boundary", () => {
    // Structural check rather than `instanceof`: a second copy of the module (or a
    // bundled build) makes `instanceof` fail on a genuine AppError, silently
    // downgrading a 409 into a detail-free 500.
    const foreign = { name: "AppError", status: 409, expose: "Conflict." };

    const { status, expose } = normalizeError(foreign);

    assert.equal(status, 409);
    assert.equal(expose, "Conflict.");
  });
});

describe("over HTTP", () => {
  let server: Server;
  let base: string;

  before(async () => {
    const app = express();
    app.use(express.json());

    app.get("/cast", () => {
      throw new mongoose.Error.CastError("ObjectId", "nope", "_id");
    });
    app.get("/dupe", () => {
      throw duplicateKey();
    });
    app.get("/boom", () => {
      throw new Error("MongoServerError: host 10.0.3.4 timed out");
    });
    app.get("/async-throws", async () => {
      // No `next`, exactly like 63 of our real handlers. Express 5 still routes
      // the rejection here; Express 4 would leave the request hanging.
      throw new Error("rejected from an async handler");
    });
    app.get("/app-error", () => {
      throw new AppError("Nothing left in stock", { status: 409 });
    });

    // Same registration order as server.ts.
    app.use(notFoundHandler);
    app.use(errorHandler);

    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("answers a malformed id with 400 and no internals", async () => {
    const res = await fetch(`${base}/cast`);
    const body = await res.json();

    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.doesNotMatch(JSON.stringify(body), /CastError|ObjectId|nope/);
  });

  it("answers a duplicate with 409", async () => {
    const res = await fetch(`${base}/dupe`);

    assert.equal(res.status, 409);
    assert.doesNotMatch(await res.text(), /E11000/);
  });

  it("answers our own fault with 500 and nothing else", async () => {
    const res = await fetch(`${base}/boom`);
    const text = await res.text();

    assert.equal(res.status, 500);
    // The regression this file exists for: the old code put this in the body.
    assert.doesNotMatch(text, /10\.0\.3\.4/);
    assert.doesNotMatch(text, /MongoServerError/);
    assert.equal(JSON.parse(text).success, false);
  });

  it("keeps an AppError's own message and status", async () => {
    const res = await fetch(`${base}/app-error`);
    const body = await res.json();

    assert.equal(res.status, 409);
    assert.equal(body.message, "Nothing left in stock");
  });

  it("answers an unknown route with JSON, not an HTML page", async () => {
    // Without `notFoundHandler`, Express replies with its own HTML 404 and the
    // client`s `res.data.message` is undefined, which surfaces three layers away
    // as "cannot read property of undefined".
    const res = await fetch(`${base}/no/such/route`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.success, false);
    assert.match(body.message, /GET/);
    assert.match(body.message, /no\/such\/route/);
  });

  it("keeps the arity Express requires of an error handler", () => {
    // Express selects error middleware by parameter count. Losing `next` turns
    // this into an ordinary handler that is skipped on error, and the request
    // hangs until it times out — with no error reported anywhere.
    assert.equal(errorHandler.length, 4);
  });

  it("catches a rejected async handler that never calls next", async () => {
    // 63 of our handlers are `async (req, res)` with no `next`, so an unexpected
    // rejection has to reach this handler by itself. Only Express 5 forwards it;
    // on 4 the request hangs until it times out with no error anywhere. Proven
    // here rather than read off the version number, because the behaviour is what
    // matters and it changes silently on upgrade.
    const res = await fetch(`${base}/async-throws`, {
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json();

    assert.equal(res.status, 500);
    assert.equal(body.message, "Something went wrong. Please try again.");
    // The original text stays in the log, not in the response.
    assert.doesNotMatch(JSON.stringify(body), /from an async handler/);
  });

  it("runs on the Express version that forwards async rejections", () => {
    assert.ok(
      expressMajor >= 5,
      `express ${expressMajor} does not forward a rejected async handler to the ` +
        "error middleware, so every handler without a `next` hangs instead of " +
        "reporting an error. Add `next` to those handlers, or wrap the router."
    );
  });
});

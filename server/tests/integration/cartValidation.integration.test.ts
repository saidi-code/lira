// tests/integration/cartValidation.integration.test.ts
// ==========================================
//   The cart accepts a body it should reject.
//
// Found while auditing input validation, and worth an integration test rather
// than a unit one because the bug was a *chain*: every individual guard was
// reasonable, and only the combination let a bad value through.
//
//   quantity: "abc"
//     -> quantity <= 0              is false  ("abc" coerces to NaN)
//     -> product.stock < quantity   is false  (5 < NaN is false)
//     -> Mongoose casts to Number   gives NaN
//     -> min: 1 on the schema       NaN < 1 is false, so it is accepted
//
// The cart then holds a line with a NaN quantity, which is what the order flow
// would later read. Every step passes; only the end result is wrong.
//
// This drives the real handler over a real socket against a real database, so it
// covers the guards as they are actually wired rather than as they are read.
// ==========================================
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import Cart from "../../models/Cart.js";
import Product from "../../models/Products.js";
import { addToCart, updateCartItem } from "../../controllers/CartController.js";
import { errorHandler, notFoundHandler } from "../../middlewares/errorHandler.js";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

let mongod: MongoMemoryServer;
let base: string;
let userId: string;
let server: ReturnType<typeof import("node:http").createServer>;

/**
 * A product with known stock, so the stock comparison is meaningful.
 *
 * Every required field is set explicitly. That is not incidental: the schema's
 * own validation message is exactly the kind of internals this work stops
 * returning to clients, and a fixture missing a field fails with that message
 * rather than something readable.
 */
const seedProduct = async (stock: number) =>
  Product.create({
    name: "Test perfume",
    subtitle: "a subtitle",
    description: "a description",
    brand: "lyra",
    // A real Category id — this is an ObjectId ref, not a title.
    category: new mongoose.Types.ObjectId(),
    // An enum value, not a display string.
    subCategory: "man",
    sku: `SKU-${new mongoose.Types.ObjectId().toString()}`,
    price: 100,
    stock,
    type: "simple",
    images: [],
  });

/** `protect` is bypassed: the handler only needs `req.user._id`. */
const asUser = (userId: string) => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  (req as express.Request & { user?: unknown }).user = { _id: new mongoose.Types.ObjectId(userId), role: "user" };
  next();
};

const post = (path: string, body: unknown) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const put = (path: string, body: unknown) =>
  fetch(`${base}${path}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: LAUNCH_TIMEOUT_MS },
  });
  await mongoose.connect(mongod.getUri());

  const app = express();
  app.use(express.json());
  userId = new mongoose.Types.ObjectId().toString();
  app.post("/cart/add", asUser(userId), addToCart);
  app.put("/cart/item/:productId", asUser(userId), updateCartItem);
  app.use(notFoundHandler);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  base = `http://127.0.0.1:${port}`;
});

after(async () => {
  // See bodyValidation.integration.test.ts: fetch keeps connections alive, and
  // server.close() waits for them.
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await mongod.stop();
});

/**
 * The line for one product, not `items[0]`.
 *
 * Every test in this file shares a single user, so the cart accumulates lines as
 * the suite runs. `items[0]` would therefore be a different product's line — which
 * is what made the first version of these assertions fail for the right reason
 * and the wrong value.
 */
const lineFor = async (productId: string) => {
  // Queried by user rather than by `items.product`: a dotted path is not
  // expressible in Mongoose's typed filter, and this is the same document.
  const cart = await Cart.findOne({ user: new mongoose.Types.ObjectId(userId) });
  return cart?.items.find((item) => item.product.toString() === productId);
};

describe("cart quantity validation", () => {
  it("rejects a string quantity instead of storing NaN", async () => {
    const product = await seedProduct(10);

    const res = await post("/cart/add", { productId: product._id.toString(), quantity: "abc" });

    assert.equal(res.status, 400);

    // The assertion that matters: nothing was written. Before the fix this
    // returned 200 and left a line whose quantity was NaN.
    assert.equal(
      await lineFor(product._id.toString()),
      undefined,
      "no cart line should exist for a rejected quantity"
    );
  });

  it("rejects other values that only look numeric", async () => {
    const product = await seedProduct(10);

    for (const bad of [{}, [], true, 1.5, 0, -2]) {
      const res = await post("/cart/add", {
        productId: product._id.toString(),
        quantity: bad,
      });
      assert.equal(res.status, 400, `quantity=${JSON.stringify(bad)} should be rejected`);
    }

    assert.equal(
      await lineFor(product._id.toString()),
      undefined,
      "none of the rejected values created a line"
    );
  });

  it("still accepts an ordinary quantity", async () => {
    const product = await seedProduct(10);

    const res = await post("/cart/add", {
      productId: product._id.toString(),
      quantity: 3,
    });

    assert.equal(res.status, 200);
    assert.equal((await lineFor(product._id.toString()))?.quantity, 3);
  });

  it("rejects a string quantity on update", async () => {
    const product = await seedProduct(10);
    await post("/cart/add", { productId: product._id.toString(), quantity: 2 });

    const res = await put(`/cart/item/${product._id.toString()}`, { quantity: "abc" });

    assert.equal(res.status, 400);
    // The stored line is untouched: a rejected update must not partially apply.
    assert.equal((await lineFor(product._id.toString()))?.quantity, 2);
  });

  it("keeps treating zero as remove, which is what the client means", async () => {
    const product = await seedProduct(10);
    await post("/cart/add", { productId: product._id.toString(), quantity: 2 });

    const res = await put(`/cart/item/${product._id.toString()}`, { quantity: 0 });

    assert.equal(res.status, 200);
    assert.equal(await lineFor(product._id.toString()), undefined, "quantity 0 removes the line");
  });
});
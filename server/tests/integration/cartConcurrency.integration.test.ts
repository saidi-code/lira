// tests/integration/cartConcurrency.integration.test.ts
// ==========================================
//   The audit that found this: after the wishlist's check-then-write was fixed,
//   the question was whether anything else had the same shape. Two things did,
//   and this is the more serious of them.
//
//   `addToCart` reads the whole cart document, mutates the array in memory, then
//   saves it back:
//
//       const cart = await Cart.findOne({ user });
//       const existing = cart.items.find(…);
//       existing ? existing.quantity += n : cart.items.push(…)
//       await cart.save();
//
//   That is a read-modify-write on a document, and MongoDB applies no locking to
//   it. Two adds that overlap both read the same starting quantity, both add
//   their own, and the second `save()` overwrites the first's work. The customer
//   adds 2 then 1 of the same item and the cart says 1.
//
//   Worse than the wishlist duplicate in two ways: it is *loss* rather than a
//   visible duplicate, and the client triggers it trivially. `useCart` exposes
//   `loading`, but the add button does not disable itself while a mutation is in
//   flight, so a double-tap on "add to bag" is enough.
//
//   It is also not fixable with the filter-guard trick used for the wishlist. An
//   increment has to be applied by the database, because the value being written
//   is a function of the value already stored. Anything that computes the new
//   quantity in Node and writes it back can lose an update.
//   ==========================================
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import Cart from "../../models/Cart.js";
import Product from "../../models/Products.js";
import { addToCart } from "../../controllers/CartController.js";
import { errorHandler, notFoundHandler } from "../../middlewares/errorHandler.js";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

let mongod: MongoMemoryServer;
let base: string;
let userId: string;
let server: ReturnType<typeof import("node:http").createServer>;

const asUser = (id: string) => (
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) => {
  (req as express.Request & { user?: unknown }).user = {
    _id: new mongoose.Types.ObjectId(id),
    role: "user",
  };
  next();
};

const seedProduct = (stock = 50) =>
  Product.create({
    name: "Test perfume",
    subtitle: "a subtitle",
    description: "a description",
    brand: "lyra",
    category: new mongoose.Types.ObjectId(),
    subCategory: "man",
    sku: `SKU-${new mongoose.Types.ObjectId().toString()}`,
    price: 100,
    stock,
    type: "simple",
    images: ["https://example.test/a.jpg"],
    colors: [],
  });

const post = (root: string, productId: string, quantity: number) =>
  fetch(`${root}/cart/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });

const add = (productId: string, quantity: number) => post(base, productId, quantity);

const quantityOf = async (user: string, productId: string): Promise<number | undefined> => {
  const cart = await Cart.findOne({ user }).lean();
  const line = cart?.items?.find(
    (item: { product?: unknown }) => String(item?.product ?? "") === productId
  );
  return line?.quantity;
};
/** A second server on its own port, so a second user can be exercised. */
const withFreshUser = async <T,>(
  run: (freshBase: string, freshUserId: string) => Promise<T>
): Promise<T> => {
  const freshUserId = new mongoose.Types.ObjectId().toString();
  const app = express();
  app.use(express.json());
  app.post("/cart/add", asUser(freshUserId), addToCart);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const s = app.listen(0);
  await new Promise<void>((resolve) => s.once("listening", resolve));
  const addr = s.address();
  const freshBase = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
  try {
    return await run(freshBase, freshUserId);
  } finally {
    s.closeAllConnections();
    await new Promise<void>((resolve) => s.close(() => resolve()));
  }
};

before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: LAUNCH_TIMEOUT_MS },
  });
  await mongoose.connect(mongod.getUri());

  const app = express();
  app.use(express.json());
  userId = new mongoose.Types.ObjectId().toString();
  app.post("/cart/add", asUser(userId), addToCart);
  app.use(notFoundHandler);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await mongod.stop();
});

describe("adding the same line to the cart at the same time", () => {
  it("adds up every quantity rather than keeping only the last", async () => {
    const product = await seedProduct();
    const id = String(product._id);

    // 2, then two adds of 1 together. A lost update leaves 2 or 3, never 4.
    await add(id, 2);
    await Promise.all([add(id, 1), add(id, 1)]);

    assert.equal(
      await quantityOf(userId, id),
      4,
      "2 + 1 + 1 should be 4; a lost update loses one of them"
    );
  });

  it("does not lose an update when several arrive together on an empty cart", async () => {
    const product = await seedProduct();
    const id = String(product._id);

    // A different user, so the cart genuinely starts absent and every request
    // takes the "no cart yet" branch — each building one from `items: []`.
    await withFreshUser(async (freshBase, freshUserId) => {
      await Promise.all([
        post(freshBase, id, 1),
        post(freshBase, id, 1),
        post(freshBase, id, 1),
      ]);

      assert.equal(
        await Cart.countDocuments({ user: freshUserId }),
        1,
        "one cart, not several racing to create one"
      );
      assert.equal(await quantityOf(freshUserId, id), 3, "three adds of 1 should total 3");
    });
  });
});
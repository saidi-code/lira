// tests/integration/wishlistConcurrently.integration.test.ts
// ==========================================
//   The wishlist's add path was a check-then-write.
//
//   `addToWishList` looked for the product, found nothing, then `$push`ed it.
//   Two requests that interleave between those two steps both see "not in the
//   list" and both push, so the product is stored twice. There is no unique
//   index on `items.product` — MongoDB cannot index across an array of
//   subdocuments to enforce that — so nothing downstream catches it. The client
//   renders one row per entry, so the customer sees the same perfume twice and
//   removing it leaves the other copy.
//
//   This is the same read-then-write shape as the oversell and double-cancel
//   bugs, and it is reachable by a double-tap on the heart button, which the
//   client does not disable while the mutation is in flight (`useFavoris`
//   exposes `loading` but `toggleLike` never consults it).
//
//   The fix is `$addToSet`, which is a single atomic operation: the server
//   decides whether the element is already there, so there is no window.
//   ==========================================
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import Product from "../../models/Products.js";
import WishList from "../../models/WishList.js";
import { addToWishList, getWishList } from "../../controllers/wishListController.js";
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

const seedProduct = () =>
  Product.create({
    name: "Test perfume",
    subtitle: "a subtitle",
    description: "a description",
    brand: "lyra",
    category: new mongoose.Types.ObjectId(),
    subCategory: "man",
    sku: `SKU-${new mongoose.Types.ObjectId().toString()}`,
    price: 100,
    stock: 10,
    type: "simple",
    images: ["https://example.test/a.jpg"],
    colors: [],
  });

const add = (productId: string) =>
  fetch(`${base}/wishlist/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId }),
  });

before(async () => {
  mongod = await MongoMemoryServer.create({
    instance: { launchTimeout: LAUNCH_TIMEOUT_MS },
  });
  await mongoose.connect(mongod.getUri());

  const app = express();
  app.use(express.json());
  userId = new mongoose.Types.ObjectId().toString();
  app.post("/wishlist/add", asUser(userId), addToWishList);
  app.get("/wishlist", asUser(userId), getWishList);
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

describe("loading an empty wishlist at the same time", () => {
  it("answers every caller and creates the document once", async () => {
    // A brand-new user: nothing exists yet, so this is where the old
    // find-then-create lost to its own unique index.
    const fresh = new mongoose.Types.ObjectId().toString();
    const asFresh = asUser(fresh);

    const app = express();
    app.use(express.json());
    app.get("/wishlist", asFresh, getWishList);
    app.use(notFoundHandler);
    app.use(errorHandler);

    const freshServer = app.listen(0);
    await new Promise<void>((resolve) => freshServer.once("listening", resolve));
    const addr = freshServer.address();
    const freshBase = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;

    try {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => fetch(`${freshBase}/wishlist`))
      );

      for (const res of responses) {
        assert.equal(res.status, 200, `a GET of an empty wishlist should be 200`);
        const body = await res.json();
        assert.equal(body.success, true);
        assert.deepEqual(body.data.items, []);
      }

      assert.equal(
        await WishList.countDocuments({ user: fresh }),
        1,
        "concurrent loads must create exactly one wishlist"
      );
    } finally {
      freshServer.closeAllConnections();
      await new Promise<void>((resolve) => freshServer.close(() => resolve()));
    }
  });
});

describe("adding the same product at the same time", () => {
  it("stores it once, not twice", async () => {
    const product = await seedProduct();

    // Fired together rather than awaited one at a time: the whole point is that
    // the requests overlap on the server. Sequential awaits would pass against
    // the old code too, because the second call would see the first's write.
    const id = String(product._id); // String(), not the raw ObjectId: the helper
    // takes a string, and this is the same value the client sends.
    const responses = await Promise.all(Array.from({ length: 5 }, () => add(id)));

    assert.equal(
      await WishList.countDocuments({ user: userId }),
      1,
      "the five parallel adds should leave one wishlist"
    );

    const stored = await WishList.findOne({ user: userId }).lean();
    const copies = (stored?.items ?? []).filter(
      (item: { product?: unknown }) => String(item?.product ?? "") === String(product._id)
    );
    assert.equal(
      copies.length,
      1,
      "the product should be stored once however many adds arrive"
    );

    // Every caller still gets a usable answer: either it was added (200) or it
    // was already there (400). What must not happen is a 500, or a silent second
    // copy — the status alone cannot tell those apart, so the stored count above
    // is what actually proves the race is closed.
    for (const res of responses) {
      assert.ok(
        res.status === 200 || res.status === 400,
        `unexpected status ${res.status}`
      );
      const body = await res.json();
      assert.equal(typeof body.success, "boolean");
    }
  });

  it("does not leak the duplicate through the read path either", async () => {
    const product = await seedProduct();
    const id = String(product._id);
    await Promise.all(Array.from({ length: 3 }, () => add(id)));

    const res = await fetch(`${base}/wishlist`);
    const body = await res.json();

    // Counted for THIS product, not in total: both tests share one user, so by
    // now the list legitimately holds the first test's product as well. An
    // assertion on the total would be testing the fixtures, not the bug.
    const forThisProduct = (body.data?.items ?? []).filter(
      (item: { product?: { _id?: unknown } }) => String(item?.product?._id ?? "") === id
    );

    assert.equal(
      forThisProduct.length,
      1,
      "the customer must not see this product twice"
    );
  });
});
// tests/integration/bodyValidation.integration.test.ts
// ==========================================
//   The same coercion bug, in the two other places it was found.
//
// `utils/validate.ts` was written after the cart accepted {"quantity": "abc"}.
// Applying it to the rest of the API turned up two more instances of the same
// shape, both on paths that change data a customer sees:
//
//   upsertReview    `!rating || rating < 1 || rating > 5` — three coercing
//                   checks, so "abc" made all of them false and the rating was
//                   stored as NaN. 2.7 passed too.
//   updateProduct   `Number(price)` / `Number(stock)` — Number(null),
//                   Number(""), Number([]) and Number(false) are all 0, so
//                   {"stock": null} silently zeroed a product's stock, and
//                   {"price": "abc"} stored NaN.
//
// What is NOT here is equally deliberate: inventoryController, transferController
// and purchaseOrderController already guard with `Number.isFinite` /
// `Number.isInteger`, which reject NaN correctly. Auditing them found nothing,
// and pretending otherwise would make this file a list of everything rather than
// of what was broken.
// ==========================================
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import express from "express";
import mongoose from "mongoose";

import Product from "../../models/Products.js";
import Review from "../../models/Review.js";
import Address from "../../models/Address.js";
import Supplier from "../../models/Supplier.js";
import Collection from "../../models/Collections.js";
import Category from "../../models/Categories.js";
import { upsertReview } from "../../controllers/ReviewController.js";
import { updateProduct } from "../../controllers/productController.js";
import { createAddress } from "../../controllers/AddressController.js";
import { createSupplier } from "../../controllers/supplierController.js";
import { createCollection } from "../../controllers/CollectionController.js";
import { errorHandler, notFoundHandler } from "../../middlewares/errorHandler.js";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

let mongod: MongoMemoryServer;
let base: string;
let userId: string;
let server: ReturnType<typeof import("node:http").createServer>;

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
  });

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

const send = (method: "POST" | "PUT", path: string, body: unknown) =>
  fetch(`${base}${path}`, {
    method,
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
  app.post("/reviews/product/:id", asUser(userId), upsertReview);
  app.put("/products/:id", asUser(userId), updateProduct);
  app.post("/addresses", asUser(userId), createAddress);
  app.post("/suppliers", asUser(userId), createSupplier);
  app.post("/collections", asUser(userId), createCollection);
  app.use(notFoundHandler);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}`;
});

after(async () => {
  // closeAllConnections() is required, not a nicety: `fetch` (undici) holds
  // connections open, and server.close() waits for them. Without this the suite
  // hangs after its last assertion instead of exiting.
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  await mongod.stop();
});

describe("review rating", () => {
  it("rejects a rating that only looks numeric", async () => {
    const product = await seedProduct();

    for (const bad of ["abc", "3", true, {}, []]) {
      const res = await send("POST", `/reviews/product/${product._id}`, { rating: bad });
      assert.equal(res.status, 400, `rating=${JSON.stringify(bad)} should be rejected`);
    }

    assert.equal(await Review.countDocuments({ product: product._id }), 0);
  });

  it("rejects a fractional rating", async () => {
    const product = await seedProduct();
    const res = await send("POST", `/reviews/product/${product._id}`, { rating: 2.7 });

    assert.equal(res.status, 400);
    assert.equal(await Review.countDocuments({ product: product._id }), 0);
  });

  it("still accepts a whole rating in range", async () => {
    const product = await seedProduct();
    const res = await send("POST", `/reviews/product/${product._id}`, { rating: 4 });

    assert.equal(res.status, 201);
    const review = await Review.findOne({ product: product._id });
    assert.equal(review?.rating, 4);
  });
});

describe("product update", () => {
  it("rejects a price or stock that only looks numeric", async () => {
    const product = await seedProduct();

    for (const bad of ["abc", null, "", [], false]) {
      const res = await send("PUT", `/products/${product._id}`, { stock: bad });
      assert.equal(res.status, 400, `stock=${JSON.stringify(bad)} should be rejected`);
    }

    const unchanged = await Product.findById(product._id);
    assert.equal(unchanged?.stock, 10, "a rejected update must not change stock");
  });

  it("does not silently zero the stock", async () => {
    // The specific harm: Number(null) is 0, so this used to succeed and leave the
    // product unsellable, with no error anywhere.
    const product = await seedProduct();
    const res = await send("PUT", `/products/${product._id}`, { stock: null });

    assert.equal(res.status, 400);
    assert.equal((await Product.findById(product._id))?.stock, 10);
  });

  it("still accepts an ordinary update", async () => {
    const product = await seedProduct();
    const res = await send("PUT", `/products/${product._id}`, {
      stock: 25,
      price: 120,
      // Required: updateProduct rejects an update whose final image list would
      // be empty, so without this the request short-circuits before saving.
      // Note that it answers 200 with `success: false` when it does — see the
      // open question about that status in AGENT.md.
      existingImages: "https://example.test/a.jpg",
    });

    assert.equal(res.status, 200);
    const updated = await Product.findById(product._id);
    assert.equal(updated?.stock, 25);
    assert.equal(updated?.price, 120);
  });
describe("address and supplier bodies", () => {
  // Neither controller had these guards, and both write into documents whose
  // schema declares no maxlength anywhere.
  const post = (path: string, body: unknown) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("rejects an address field that is an object", async () => {
    const res = await post("/addresses", {
      street: { not: "a street" },
      city: "Tunis",
      state: "Tunis",
      zipCode: "1000",
      phoneNumber: "+216 20 000 000",
    });

    // Before the fix this was truthy, so Mongoose stored "[object Object]" as
    // the street — which is what gets printed on a parcel.
    assert.equal(res.status, 400);
    assert.equal(await Address.countDocuments({}), 0);
  });

  it("still creates a real address", async () => {
    const res = await post("/addresses", {
      type: "Home",
      street: "12 rue de la Liberte",
      city: "Tunis",
      state: "Tunis",
      zipCode: "1000",
      phoneNumber: "+216 20 000 000",
    });

    assert.equal(res.status, 201);
    assert.equal((await Address.findOne({}))?.street, "12 rue de la Liberte");
  });

  it("rejects an unknown address type", async () => {
    const res = await post("/addresses", {
      type: "Spaceship",
      street: "12 rue de la Liberte",
      city: "Tunis",
      state: "Tunis",
      zipCode: "1000",
      phoneNumber: "+216 20 000 000",
    });

    assert.equal(res.status, 400);
  });

  it("rejects a supplier field that only looks like a string", async () => {
    const res = await post("/suppliers", {
      name: "Maison Duarte",
      contact: { name: "nope" },
    });

    assert.equal(res.status, 400);
    assert.equal(await Supplier.countDocuments({}), 0);
  });

  it("rejects a supplier address that is not an object", async () => {
    // The schema nests address; a plain string used to be assigned straight in.
    const res = await post("/suppliers", { name: "Maison Duarte", address: "somewhere" });

    assert.equal(res.status, 400);
    assert.equal(await Supplier.countDocuments({}), 0);
  });

  it("still creates a real supplier", async () => {
    const res = await post("/suppliers", {
      name: "Maison Duarte",
      contact: "Ana",
      address: { city: "Lisbon", country: "PT" },
    });

    assert.equal(res.status, 201);
    const supplier = await Supplier.findOne({ name: "Maison Duarte" });
    assert.equal(supplier?.contact, "Ana");
    assert.equal(supplier?.address?.city, "Lisbon");
    // Absent fields become empty strings, not "[object Object]".
    assert.equal(supplier?.address?.street, "");
  });
});
describe("schema length bounds", () => {
  // The controllers give the better message; these prove the schema is a real
  // backstop, so a write from anywhere else is bounded too.
  const models = [
    ["Category", Category, { title: "ع".repeat(500), icon: "i" }],
    ["Address", Address, { type: "Home", street: "s".repeat(9999), city: "c", state: "s", zipCode: "1", phoneNumber: "2" }],
    ["Collection", Collection, { title: "t".repeat(9999), subtitle: "s", cta: "c", banner: "b" }],
    ["Supplier", Supplier, { name: "n".repeat(9999) }],
  ] as const;

  for (const [name, model, doc] of models) {
    it(`${name} refuses an over-long string`, async () => {
      await assert.rejects(
        () => (model as { create(d: unknown): Promise<unknown> }).create(doc),
        // Case-insensitive on purpose: Mongoose renders the message as
        // "<Model> validation failed: ...", so the capitalised form never matches.
        /maximum allowed length|validation failed/i,
        `${name} should reject an over-long field`
      );
    });
  }
});

describe("collection create", () => {
  const post = (path: string, body: unknown) =>
    fetch(`${base}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("rejects a title that is an object", async () => {
    const res = await post("/collections", {
      title: { not: "a title" },
      subtitle: "s",
      cta: "c",
      banner: "b",
    });

    // Before the fix this was truthy, so "[object Object]" became the title of a
    // collection rendered on the storefront.
    assert.equal(res.status, 400);
    assert.equal(await Collection.countDocuments({}), 0);
  });

  it("rejects products that is not an array of ids", async () => {
    const res = await post("/collections", {
      title: "Summer",
      subtitle: "s",
      cta: "c",
      banner: "b",
      products: "not-an-array",
    });

    assert.equal(res.status, 400);
  });

  it("still creates a real collection", async () => {
    const res = await post("/collections", {
      title: "Summer",
      subtitle: "Warm weather picks",
      cta: "Shop now",
      banner: "https://example.test/b.jpg",
      products: [],
    });

    assert.equal(res.status, 201);
    assert.equal((await Collection.findOne({ title: "Summer" }))?.cta, "Shop now");
  });
});
});
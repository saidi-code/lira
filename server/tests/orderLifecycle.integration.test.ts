// tests/orderLifecycle.integration.test.ts
// ==========================================
// CANCELLATION AND PAYMENT EXPIRY, FOR REAL
// ==========================================
// The lifecycle rules are unit-tested with injected stores, which proves the
// decisions but not the writes. This runs the real `expiryStore` and the real
// `cancelAndRestock` against a real database, because this is where money and
// stock meet: an order that is released twice returns phantom units, and an
// order that is paid after release sells stock that is already back on a shelf.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Inventory from "../models/Inventory.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import StockMovement from "../models/StockMovement.js";
import Warehouse from "../models/Warehouse.js";
import { applyMovement, available } from "../services/inventoryService.js";
import { reserveForOrder } from "../services/orderStockService.js";
import {
  expiryStore,
  markOrderPaid,
  releaseExpiredOrders,
} from "../services/orderLifecycleService.js";
import { cancelAndRestock } from "../controllers/OrderController.js";

let mongod: MongoMemoryServer;
const HOUR = 60 * 60 * 1000;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Order.init();
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

const shop = async (stock: number) => {
  const warehouse = await Warehouse.create({
    name: "Main",
    code: "MAIN",
    isActive: true,
    isDefault: true,
  });
  const product = await Product.create({
    name: "Oud Wood 50ml",
    sku: "SMP-1",
    subtitle: "s",
    description: "d",
    category: new mongoose.Types.ObjectId(),
    subCategory: "man",
    brand: "Lira",
    price: 100,
    stock,
  });
  await Inventory.create({
    product: product._id,
    warehouse: warehouse._id,
    quantity: 0,
    reserved: 0,
  });
  await applyMovement("in", {
    product: product._id,
    warehouse: warehouse._id,
    quantity: stock,
  });
  return { product, warehouse };
};

/** A placed order that has already taken its hold, as checkout leaves it. */
const order = async (
  product: { _id: mongoose.Types.ObjectId; name: string; stock: number },
  warehouse: { _id: mongoose.Types.ObjectId },
  over: {
    paymentMethod?: "cash" | "stripe";
    paymentStatus?: string;
    ageMs?: number;
  } = {}
) => {
  const created = await Order.create({
    user: new mongoose.Types.ObjectId(),
    items: [
      {
        product: product._id,
        name: product.name,
        price: 100,
        quantity: 2,
        subtotal: 200,
      },
    ],
    shippingAddress: {
      type: "Home",
      street: "1 Rue de Paris",
      city: "Tunis",
      state: "Tunis",
      zipCode: "1000",
      phoneNumber: "+216000000",
    },
    paymentMethod: over.paymentMethod ?? "cash",
    paymentStatus: over.paymentStatus ?? "pending",
    orderStatus: "placed",
    subtotal: 200,
    totalAmount: 200,
    warehouse: warehouse._id,
  });

  await reserveForOrder(
    [{ product: product._id, name: product.name, quantity: 2 }],
    created.orderNumber ?? String(created._id)
  );
  await Product.updateOne(
    { _id: product._id },
    { $set: { stock: product.stock - 2 } }
  );

  if (over.ageMs) {
    // `createdAt` is set by timestamps, so it is moved directly.
    const when = new Date(Date.now() - over.ageMs);
    await Order.collection.updateOne(
      { _id: created._id },
      { $set: { createdAt: when } }
    );
  }

  return Order.findById(created._id).lean().then((doc) => {
    assert.ok(doc, "the order was just created");
    return doc;
  });
};

const inv = (product: mongoose.Types.ObjectId, warehouseId: mongoose.Types.ObjectId) =>
  Inventory.findOne({ product, warehouse: warehouseId }).lean();

const sellable = (row: Awaited<ReturnType<typeof inv>>) =>
  available({ quantity: row?.quantity ?? 0, reserved: row?.reserved ?? 0 });
describe("cancelling an order", () => {
  it("puts the units back on the shelf", async () => {
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse);

    assert.equal(sellable(await inv(product._id, warehouse._id)), 8, "held");

    const cancelled = await cancelAndRestock(placed as never);
    assert.equal(cancelled, true);

    const row = await inv(product._id, warehouse._id);
    assert.equal(sellable(row), 10, "all ten sellable again");
    assert.equal(row?.reserved, 0, "and the hold is gone");

    const status = await Order.findById(placed._id).lean();
    assert.equal(status?.orderStatus, "cancelled");
  });

  it("returns the stock exactly once, however many times it is asked", async () => {
    // The guarded claim: a second cancel must find no document still holding
    // stock, so it restocks nothing. Without that, a double tap on "cancel"
    // would return units that were already sold to someone else.
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse);

    assert.equal(await cancelAndRestock(placed as never), true);
    const second = await cancelAndRestock(placed as never);

    assert.equal(second, false, "the second cancel is refused");
    const row = await inv(product._id, warehouse._id);
    assert.equal(sellable(row), 10, "and did not double the stock");
  });

  it("refuses a shipped order, whose units have already gone", async () => {
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse);
    await Order.updateOne(
      { _id: placed._id },
      { $set: { orderStatus: "shipped" } }
    );

    const shipped = await Order.findById(placed._id).lean();
    assert.equal(await cancelAndRestock(shipped as never), false);

    const row = await inv(product._id, warehouse._id);
    assert.equal(row?.reserved, 2, "the hold is untouched");
  });
});

describe("releasing expired online orders", () => {
  it("releases an unpaid order past the window", async () => {
    // The whole point of the sweep: an abandoned online checkout would hold its
    // units forever, so the product reads "in stock" in nobody's cart and out of
    // stock in the shop.
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse, {
      paymentMethod: "stripe",
      ageMs: 3 * HOUR,
    });

    const result = await releaseExpiredOrders(expiryStore);

    assert.equal(result.released, 1);
    assert.equal(result.skipped, 0);
    assert.equal(sellable(await inv(product._id, warehouse._id)), 10);

    const status = await Order.findById(placed._id).lean();
    assert.equal(status?.orderStatus, "cancelled");
  });

  it("leaves an order still inside the window alone", async () => {
    const { product, warehouse } = await shop(10);
    await order(product, warehouse, {
      paymentMethod: "stripe",
      ageMs: 5 * 60 * 1000, // five minutes; the window is sixty
    });

    const result = await releaseExpiredOrders(expiryStore);

    assert.equal(result.released, 0);
    assert.equal(sellable(await inv(product._id, warehouse._id)), 8, "still held");
  });

  it("never touches cash on delivery", async () => {
    // COD is paid when it arrives, so an old COD order is a real order holding
    // stock — not an abandoned checkout. Releasing it would sell the same
    // perfume twice.
    const { product, warehouse } = await shop(10);
    await order(product, warehouse, { paymentMethod: "cash", ageMs: 3 * HOUR });

    const result = await releaseExpiredOrders(expiryStore);
    assert.equal(result.released, 0);

    const row = await inv(product._id, warehouse._id);
    assert.equal(row?.reserved, 2, "the order keeps its stock");
  });

  it("never touches an order that has been paid", async () => {
    const { product, warehouse } = await shop(10);
    await order(product, warehouse, {
      paymentMethod: "stripe",
      paymentStatus: "paid",
      ageMs: 3 * HOUR,
    });

    const result = await releaseExpiredOrders(expiryStore);
    assert.equal(result.released, 0);
    assert.equal((await inv(product._id, warehouse._id))?.reserved, 2);
  });

  it("is safe to run twice", async () => {
    const { product, warehouse } = await shop(10);
    await order(product, warehouse, { paymentMethod: "stripe", ageMs: 3 * HOUR });

    const first = await releaseExpiredOrders(expiryStore);
    const second = await releaseExpiredOrders(expiryStore);

    assert.equal(first.released, 1);
    assert.equal(second.released, 0, "nothing left to release");
    assert.equal(
      sellable(await inv(product._id, warehouse._id)),
      10,
      "and the stock was not returned twice"
    );
  });
});
describe("confirming payment", () => {
  it("settles a pending order once", async () => {
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse, { paymentMethod: "stripe" });

    const first = await markOrderPaid(String(placed._id), {
      paymentIntentId: "pi_123",
    });
    assert.equal(first.ok, true);

    const settled = await Order.findById(placed._id).lean();
    assert.equal(settled?.paymentStatus, "paid");
    assert.equal(settled?.paymentIntentId, "pi_123");
  });

  it("reports a repeated webhook rather than re-running anything", async () => {
    // Gateways retry. The second delivery must be a no-op, not a second
    // fulfilment.
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse, { paymentMethod: "stripe" });

    await markOrderPaid(String(placed._id));
    const second = await markOrderPaid(String(placed._id));

    assert.equal(second.ok, false);
    assert.equal(second.ok === false ? second.reason : "", "not_payable");
  });

  it("refuses an order whose stock was already released", async () => {
    // The units are back on a shelf and may already be sold. Taking the money
    // would be taking payment for stock the shop no longer has — the situation
    // that has to become a refund instead.
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse, {
      paymentMethod: "stripe",
      ageMs: 3 * HOUR,
    });

    await releaseExpiredOrders(expiryStore);
    const result = await markOrderPaid(String(placed._id));

    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.reason : "", "not_payable");
    assert.equal(
      sellable(await inv(product._id, warehouse._id)),
      10,
      "and the stock is genuinely back"
    );
  });

  it("reports a missing order rather than throwing", async () => {
    const result = await markOrderPaid(new mongoose.Types.ObjectId().toString());
    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.reason : "", "not_found");
  });

  it("rejects a malformed id without touching the database", async () => {
    const result = await markOrderPaid("not-an-id");
    assert.equal(result.ok, false);
    assert.equal(result.ok === false ? result.reason : "", "invalid");
  });
});

describe("the ledger explains both sides", () => {
  it("records a release when an order expires", async () => {
    const { product, warehouse } = await shop(10);
    const placed = await order(product, warehouse, {
      paymentMethod: "stripe",
      ageMs: 3 * HOUR,
    });

    await releaseExpiredOrders(expiryStore);

    const movement = await StockMovement.findOne({
      reference: placed.orderNumber ?? "",
      type: "release",
    }).lean();
    assert.ok(movement, "the release is auditable against its order");
  });
});
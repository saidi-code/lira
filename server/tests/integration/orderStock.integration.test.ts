// tests/orderStock.integration.test.ts
// ==========================================
// CHECKOUT → LEDGER, AGAINST A REAL MONGODB
// ==========================================
// The ledger service is verified, and the order bridge is unit-tested with fakes.
// What neither covered is the *pair* of them, which is where the damage lands:
//
//   placed   -> reserve, availability down, warehouse stamped on the order
//   shipped  -> commit,  hold cleared *and* units gone
//   cancelled-> release, availability back
//
// The `commit` path is the one to watch. When it was folded into `out` it took
// the units off the shelf and left the hold behind, and the unit test passed
// because it asserted on a table rather than a document. These assert on rows.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Inventory from "../../models/Inventory.js";
import Order from "../../models/Order.js";
import Product from "../../models/Products.js";
import Warehouse from "../../models/Warehouse.js";
import { applyMovement, available } from "../../services/inventoryService.js";
import {
  commitOrderStock,
  releaseForOrder,
  reserveForOrder,
  transitionFor,
  type OrderStockLine,
} from "../../services/orderStockService.js";

let mongod: MongoMemoryServer;

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

const catalogue = async (stock: number) => {
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
  return product;
};

const warehouse = (over: Partial<Record<string, unknown>> = {}) =>
  Warehouse.create({
    name: "Main",
    code: "MAIN",
    isActive: true,
    isDefault: true,
    ...over,
  });

/** An order with a real allocation stamp, as checkout leaves it. */
const placedOrder = async (
  product: { _id: mongoose.Types.ObjectId; name: string; stock: number },
  allocation: mongoose.Types.ObjectId
) => {
  const order = await Order.create({
    user: new mongoose.Types.ObjectId(),
    items: [
      {
        product: product._id,
        name: product.name,
        price: product.stock,
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
    paymentMethod: "cash",
    paymentStatus: "pending",
    orderStatus: "placed",
    subtotal: 200,
    totalAmount: 200,
    warehouse: allocation,
  });
  return order;
};

const linesOf = (product: { _id: mongoose.Types.ObjectId; name: string }): OrderStockLine[] => [
  { product: product._id, name: product.name, quantity: 2 },
];

const inv = (
  product: mongoose.Types.ObjectId,
  warehouseId: mongoose.Types.ObjectId
) => Inventory.findOne({ product, warehouse: warehouseId }).lean();

/** `available()` wants a row, and a lean result is optional-typed. */
const sellable = (row: Awaited<ReturnType<typeof inv>>): number =>
  available({ quantity: row?.quantity ?? 0, reserved: row?.reserved ?? 0 });

describe("placing an order", () => {
  it("holds the units and takes them out of availability", async () => {
    const product = await catalogue(10);
    const main = await warehouse();
    await applyMovement("in", {
      product: product._id,
      warehouse: main._id,
      quantity: 10,
    });

    const held = await reserveForOrder(linesOf(product), "ORD-1");

    const inventory = await inv(product._id, main._id);
    assert.equal(inventory?.quantity, 10, "still physically on the shelf");
    assert.equal(inventory?.reserved, 2, "but two are held");
    assert.equal(sellable(inventory), 8, "eight are sellable");

    // The catalogue mirror is what the storefront reads, so it must follow.
    const updated = await Product.findById(product._id).lean();
    assert.equal(updated?.stock, 8, "availability fell by the held amount");
    assert.equal(held.warehouse?.toString(), main._id.toString());
  });

  it("refuses an order that would oversell, holding nothing", async () => {
    const product = await catalogue(1);
    const main = await warehouse();
    await applyMovement("in", {
      product: product._id,
      warehouse: main._id,
      quantity: 1,
    });

    await assert.rejects(
      () => reserveForOrder(linesOf(product), "ORD-2"),
      /Not enough stock/
    );

    const inventory = await inv(product._id, main._id);
    assert.equal(inventory?.reserved, 0, "a failed checkout holds nothing");
  });
});

describe("shipping an order", () => {
  it("clears the hold and takes the units off the shelf", async () => {
    // The phantom-reservation bug, in the order path. `commit` used to be an
    // `out`, which took the units away but left `reserved` at 2 — so those
    // units were neither sellable nor reconcilable, forever.
    const product = await catalogue(10);
    const main = await warehouse();
    await applyMovement("in", {
      product: product._id,
      warehouse: main._id,
      quantity: 10,
    });

    await reserveForOrder(linesOf(product), "ORD-3");
    const order = await placedOrder(product, main._id);
    order.orderStatus = "shipped";
    await order.save();

    assert.equal(transitionFor("placed", "shipped"), "commit");
    await commitOrderStock(
      linesOf(product),
      "ORD-3",
      order.warehouse as mongoose.Types.ObjectId
    );

    const inventory = await inv(product._id, main._id);
    assert.equal(inventory?.quantity, 8, "the units left the building");
    assert.equal(inventory?.reserved, 0, "and the hold went with them");
    assert.equal(sellable(inventory), 8, "availability is unchanged");

    const catalogueRow = await Product.findById(product._id).lean();
    assert.equal(
      catalogueRow?.stock,
      8,
      "Product.stock is availability, so it does not move again here"
    );
  });

  it("commits once, however far ahead the status jumps", () => {
    // `shipped -> delivered` must not take the units a second time, but
    // `placed -> delivered` must: those units did leave the building, whatever
    // the paper trail says happened to them.
    assert.equal(transitionFor("placed", "shipped"), "commit");
    assert.equal(transitionFor("placed", "delivered"), "commit");
    assert.equal(transitionFor("processing", "shipped"), "commit");
    assert.equal(transitionFor("shipped", "delivered"), "none");
    assert.equal(transitionFor("cancelled", "shipped"), "none", "already released");
  });
});

describe("cancelling an order", () => {
  it("gives the hold and the availability back", async () => {
    const product = await catalogue(10);
    const main = await warehouse();
    await applyMovement("in", {
      product: product._id,
      warehouse: main._id,
      quantity: 10,
    });

    await reserveForOrder(linesOf(product), "ORD-4");
    assert.equal(sellable(await inv(product._id, main._id)), 8);

    await releaseForOrder(
      linesOf(product),
      "ORD-4",
      main._id as mongoose.Types.ObjectId
    );

    const inventory = await inv(product._id, main._id);
    assert.equal(inventory?.reserved, 0);
    assert.equal(sellable(inventory), 10, "all ten sellable again");

    const catalogueRow = await Product.findById(product._id).lean();
    assert.equal(catalogueRow?.stock, 10);
  });

  it("returns the hold to the warehouse it was taken from", async () => {
    // The bug this pins: release used to re-resolve "the current default". Once
    // a second warehouse became default, every historical order released into
    // the wrong row — crediting stock that was never held there and stranding
    // the reservation where it actually was.
    const product = await catalogue(10);
    const original = await warehouse({ name: "Original", code: "ORIG" });
    await applyMovement("in", {
      product: product._id,
      warehouse: original._id,
      quantity: 10,
    });

    await reserveForOrder(linesOf(product), "ORD-5");
    const order = await placedOrder(product, original._id);
    assert.equal(
      (order.warehouse as mongoose.Types.ObjectId).toString(),
      original._id.toString(),
      "the order carries its allocation"
    );

    // A second site opens and takes over as default. The schema refuses two
    // defaults, so the incumbent is demoted first — which is exactly what
    // `POST /warehouses/:id/default` does.
    const second = await warehouse({
      name: "Second",
      code: "SEC",
      isDefault: false,
    });
    await Warehouse.updateOne(
      { _id: original._id },
      { $set: { isDefault: false } }
    );
    await Warehouse.updateOne(
      { _id: second._id },
      { $set: { isDefault: true } },
      { runValidators: true }
    );

    const current = await Warehouse.findOne({ isDefault: true }).lean();
    assert.equal(current?._id.toString(), second._id.toString());

    await releaseForOrder(
      linesOf(product),
      "ORD-5",
      order.warehouse as mongoose.Types.ObjectId
    );

    const fromOriginal = await inv(product._id, original._id);
    const fromSecond = await inv(product._id, second._id);

    assert.equal(
      fromOriginal?.reserved,
      0,
      "the original hold was released where it was taken"
    );
    assert.equal(
      fromSecond,
      null,
      "and the new site was not credited a phantom row or hold"
    );
  });
});
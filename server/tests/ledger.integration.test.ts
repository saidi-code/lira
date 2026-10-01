// tests/ledger.integration.test.ts
// ==========================================
// THE LEDGER, AGAINST A REAL MONGODB
// ==========================================
// Every other test here runs on pure functions and fakes, which is fast and
// proves the *rules*. It proves nothing about Mongoose: not that a `$inc` lands,
// not that a `pre("validate")` hook fires, not that an upsert behaves.
//
// Those are exactly the places the real bugs were. A `commit` that decremented
// `quantity` but not `reserved` passed every unit test, because the unit test
// asserted on a table, not on a document. And a seed that created the inventory
// row pre-filled *and* applied an `in` movement — doubling the opening stock —
// was only caught by reading the file.
//
// So: a real mongod, the real models, the real service. This is the test that
// would have caught both.
//
// Kept out of `npm test` on purpose — it needs a mongod binary, and the unit
// suite must stay runnable anywhere. Run with `npm run test:integration`.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Inventory from "../models/Inventory.js";
import Product from "../models/Products.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import StockMovement from "../models/StockMovement.js";
import Transfer from "../models/Transfer.js";
import Warehouse from "../models/Warehouse.js";
import {
  applyMovement,
  available,
  commit,
  getLowStock,
  release,
  reserve,
  transfer,
} from "../services/inventoryService.js";
import { receivePurchaseOrder } from "../services/purchaseOrderService.js";
import { applyTransferStatus } from "../services/transferService.js";

let mongod: MongoMemoryServer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
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

/**
 * A product plus its opening stock, the way a catalogue row arrives.
 *
 * The empty `Inventory` row is created first because `applyMovement` does not
 * upsert: a movement against a row that is not there fails its guard and throws
 * `InsufficientStockError`. That is exactly what `npm run seed:warehouses` does,
 * and exactly what this test pins down.
 */
const seed = async (stock: number) => {
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
    reorderLevel: 2,
  });

  if (stock > 0) {
    await applyMovement("in", {
      product: product._id,
      warehouse: warehouse._id,
      quantity: stock,
      reference: "seed",
    });
  }
  return { product, warehouse };
};

const row = (product: mongoose.Types.ObjectId, warehouse: mongoose.Types.ObjectId) =>
  Inventory.findOne({ product, warehouse }).lean();

describe("the ledger writes to a real database", () => {
  it("seeds the opening balance without doubling it", async () => {
    // The bug this exists for: creating the Inventory row already filled and
    // then applying an `in` movement would leave 2× the catalogue figure.
    const { product, warehouse } = await seed(10);

    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 10);
    assert.equal(inventory?.reserved, 0);
    assert.equal(available(inventory as never), 10);
  });

  it("records a movement row whose delta matches its type", async () => {
    const { product } = await seed(10);

    const movement = await StockMovement.findOne({
      product: product._id,
      type: "in",
    }).lean();

    assert.ok(movement, "a movement row was written");
    assert.equal(movement?.quantity, 10);
    assert.equal(movement?.delta, 10, "delta says the direction");
    assert.equal(movement?.reference, "seed");
  });

  it("refuses a row whose delta contradicts its type", async () => {
    // The schema hook, actually firing against a real validator.
    await assert.rejects(
      () =>
        StockMovement.create({
          product: new mongoose.Types.ObjectId(),
          warehouse: new mongoose.Types.ObjectId(),
          type: "out",
          quantity: 5,
          delta: 5, // an `out` is -5
        }),
      /changes quantity by -5/
    );
  });

  it("holds stock on reserve and gives it back on release", async () => {
    const { product, warehouse } = await seed(10);

    await reserve([
      { product: product._id, warehouse: warehouse._id, quantity: 4 },
    ]);
    let inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 10, "a hold does not move the shelf");
    assert.equal(inventory?.reserved, 4);
    assert.equal(available(inventory as never), 6);

    await release([
      { product: product._id, warehouse: warehouse._id, quantity: 4 },
    ]);
    inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.reserved, 0);
    assert.equal(available(inventory as never), 10);
  });

  it("clears the hold when an order is fulfilled", async () => {
    // The phantom-reservation bug. A unit test on the delta table passed while
    // the database kept `reserved` at 4 forever.
    const { product, warehouse } = await seed(10);

    await reserve([
      { product: product._id, warehouse: warehouse._id, quantity: 4 },
    ]);
    await commit([
      { product: product._id, warehouse: warehouse._id, quantity: 4 },
    ]);

    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 6, "the units left the shelf");
    assert.equal(inventory?.reserved, 0, "and the hold went with them");
    assert.equal(available(inventory as never), 6);
  });

  it("refuses to commit units that were never held", async () => {
    const { product, warehouse } = await seed(10);

    await assert.rejects(
      () =>
        commit([
          { product: product._id, warehouse: warehouse._id, quantity: 4 },
        ]),
      /Not enough stock/
    );

    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.reserved, 0, "a failed commit changes nothing");
  });

  it("moves stock between warehouses exactly once", async () => {
    const { product, warehouse } = await seed(10);
    const other = await Warehouse.create({
      name: "Overflow",
      code: "OVR",
      isActive: true,
    });

    await transfer(warehouse._id, other._id, [
      { product: product._id, quantity: 3 },
    ]);

    const source = await row(product._id, warehouse._id);
    const destination = await row(product._id, other._id);
    assert.equal(source?.quantity, 7);
    assert.equal(destination?.quantity, 3);

    // Two legs, each naming its own side — no sign required.
    const legs = await StockMovement.find({
      product: product._id,
      type: { $in: ["transfer_out", "transfer_in"] },
    })
      .sort({ type: 1 })
      .lean();

    assert.equal(legs.length, 2);
    assert.equal(legs.every((l) => l.quantity === 3), true, "magnitudes");
    assert.equal(
      legs.every((l) => Math.abs(l.delta) === 3),
      true,
      "opposite signs"
    );
  });

  it("moves stock only when a transfer is completed", async () => {
    const { product, warehouse } = await seed(10);
    const other = await Warehouse.create({
      name: "Overflow",
      code: "OVR",
      isActive: true,
    });

    const doc = await Transfer.create({
      reference: "TRF-TEST",
      fromWarehouse: warehouse._id,
      toWarehouse: other._id,
      status: "draft",
      items: [{ product: product._id, name: "Oud", quantity: 3 }],
    });

    // Bookkeeping only — nothing has physically moved yet, and the destination
    // has no row at all until stock actually arrives there.
    await applyTransferStatus(String(doc._id), "in_transit");
    const before = await row(product._id, warehouse._id);
    assert.equal(before?.quantity, 10, "in_transit moves nothing");
    assert.equal(await row(product._id, other._id), null, "nothing landed");

    await applyTransferStatus(String(doc._id), "completed");
    const source = await row(product._id, warehouse._id);
    const destination = await row(product._id, other._id);
    assert.equal(source?.quantity, 7);
    assert.equal(destination?.quantity, 3);
  });

  it("will not move the goods twice if completed again", async () => {
    const { product, warehouse } = await seed(10);
    const other = await Warehouse.create({
      name: "Overflow",
      code: "OVR",
      isActive: true,
    });

    const doc = await Transfer.create({
      reference: "TRF-RACE",
      fromWarehouse: warehouse._id,
      toWarehouse: other._id,
      status: "draft",
      items: [{ product: product._id, name: "Oud", quantity: 3 }],
    });

    await applyTransferStatus(String(doc._id), "completed");

    // Repeating the same transition is a no-op, not an error — a double tap on
    // "complete" must be harmless. What matters is the stock, not the reply.
    await applyTransferStatus(String(doc._id), "completed");

    const source = await row(product._id, warehouse._id);
    const destination = await row(product._id, other._id);
    assert.equal(source?.quantity, 7, "moved once, not twice");
    assert.equal(destination?.quantity, 3, "arrived once, not twice");
  });

  it("refuses to reopen a completed transfer", async () => {
    const { product, warehouse } = await seed(10);
    const other = await Warehouse.create({
      name: "Overflow",
      code: "OVR",
      isActive: true,
    });

    const doc = await Transfer.create({
      reference: "TRF-DONE",
      fromWarehouse: warehouse._id,
      toWarehouse: other._id,
      status: "completed",
      items: [{ product: product._id, name: "Oud", quantity: 3 }],
    });

    // Terminal state: a `completed` transfer must not be dragged backwards,
    // which would imply the goods travel twice.
    await assert.rejects(
      () => applyTransferStatus(String(doc._id), "in_transit"),
      /Cannot change a completed transfer/
    );
  });

  it("books a purchase order receipt in as stock", async () => {
    const { product, warehouse } = await seed(0);
    const supplierId = new mongoose.Types.ObjectId();

    const po = await PurchaseOrder.create({
      orderNumber: "PO-TEST-1",
      supplier: supplierId,
      status: "ordered",
      items: [
        { product: product._id, name: "Oud", quantity: 10, unitCost: 40, receivedQty: 0 },
      ],
    });

    const result = await receivePurchaseOrder(
      String(po._id),
      [{ product: product._id, quantity: 6 }],
      warehouse._id as mongoose.Types.ObjectId
    );

    assert.equal(result.status, "partially_received");
    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 6, "a partial receipt is normal");

    const updated = await PurchaseOrder.findById(po._id).lean();
    assert.equal(updated?.items[0]?.receivedQty, 6);
  });

  it("records a receipt once, not once per transaction attempt", async () => {
    // `withOptionalTransaction` re-runs its work when the deployment has no
    // transaction support, which a standalone mongod does not. `receive` used to
    // hardcode `session = undefined`, so the movement survived the first attempt
    // and landed again on the retry: 6 units received became 12, inventing stock.
    const { product, warehouse } = await seed(0);
    const supplierId = new mongoose.Types.ObjectId();

    const po = await PurchaseOrder.create({
      orderNumber: "PO-TEST-ONCE",
      supplier: supplierId,
      status: "ordered",
      items: [
        { product: product._id, name: "Oud", quantity: 10, unitCost: 40, receivedQty: 0 },
      ],
    });

    await receivePurchaseOrder(
      String(po._id),
      [{ product: product._id, quantity: 6 }],
      warehouse._id as mongoose.Types.ObjectId
    );

    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 6, "received exactly once");

    const movements = await StockMovement.countDocuments({
      product: product._id,
      type: "in",
    });
    assert.equal(movements, 1, "and audited exactly once");
  });

  it("creates the row it lands in, for a warehouse with no stock yet", async () => {
    // `npm run seed:warehouses` only walks the default warehouse, so any other
    // warehouse has no rows. Before the upsert, receiving into one threw
    // `InsufficientStockError` — which reads as "not enough stock" when the
    // truth is "no such row".
    const { product } = await seed(5);
    const fresh = await Warehouse.create({
      name: "New Site",
      code: "NEW",
      isActive: true,
    });

    const before = await row(product._id, fresh._id);
    assert.equal(before, null, "no row yet");

    await applyMovement("in", {
      product: product._id,
      warehouse: fresh._id,
      quantity: 4,
    });

    const after = await row(product._id, fresh._id);
    assert.equal(after?.quantity, 4);
    assert.equal(after?.reserved, 0);
  });

  it("still refuses to take stock out of a row that is not there", async () => {
    // The upsert applies to arrivals only. An outgoing movement against a
    // missing row is a genuine error and must not silently create one.
    const { product } = await seed(5);
    const fresh = await Warehouse.create({
      name: "New Site",
      code: "NEW",
      isActive: true,
    });

    await assert.rejects(
      () =>
        applyMovement("out", {
          product: product._id,
          warehouse: fresh._id,
          quantity: 1,
        }),
      /Not enough stock/
    );

    assert.equal(await row(product._id, fresh._id), null, "nothing created");
  });

  it("refuses to receive more than was ordered", async () => {
    const { product, warehouse } = await seed(0);
    const supplierId = new mongoose.Types.ObjectId();

    const po = await PurchaseOrder.create({
      orderNumber: "PO-TEST-2",
      supplier: supplierId,
      status: "ordered",
      items: [
        { product: product._id, name: "Oud", quantity: 10, unitCost: 40, receivedQty: 0 },
      ],
    });

    await assert.rejects(
      () =>
        receivePurchaseOrder(
          String(po._id),
          [{ product: product._id, quantity: 11 }],
          warehouse._id as mongoose.Types.ObjectId
        ),
      /only 10 outstanding/
    );

    const inventory = await row(product._id, warehouse._id);
    assert.equal(inventory?.quantity, 0, "a refused receipt adds nothing");
  });

  it("flags stock at or below its reorder level", async () => {
    const { product, warehouse } = await seed(5);
    await Inventory.updateOne(
      { product: product._id, warehouse: warehouse._id },
      { $set: { reorderLevel: 5 } }
    );

    const low = await getLowStock(warehouse._id as mongoose.Types.ObjectId);
    assert.equal(low.length, 1);
    assert.equal(low[0]?.available, 5);
  });
});
// tests/scripts.integration.test.ts
// ==========================================
// THE OPERATOR SCRIPTS, EXECUTED
// ==========================================
// `reconcile`, `repair:reservations` and `backfill:deltas` are the only things
// in this codebase that bulk-write to production data, and until now none of
// them had ever been run. Their decision rules are unit-tested; this runs the
// whole thing against a real database and checks both what it changes and —
// more importantly — what it must NOT change.
//
// The rule being tested throughout: a read-only default, and never a write that
// the ledger cannot account for.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

import Inventory from "../../models/Inventory.js";
import Order from "../../models/Order.js";
import Product from "../../models/Products.js";
import StockMovement from "../../models/StockMovement.js";
import Warehouse from "../../models/Warehouse.js";
import { applyMovement, reserve } from "../../services/inventoryService.js";
import { reconcileStock } from "../../scripts/reconcileStock.js";
import { backfillMovementDeltas } from "../../scripts/backfillMovementDeltas.js";
import { repairStrandedReservations } from "../../scripts/repairStrandedReservations.js";

let mongod: MongoMemoryServer;
const quiet = () => undefined;

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: LAUNCH_TIMEOUT_MS } });
  await mongoose.connect(mongod.getUri());
  await StockMovement.init();
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

const fixture = async (stock: number) => {
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
  if (stock > 0) {
    await applyMovement("in", {
      product: product._id,
      warehouse: warehouse._id,
      quantity: stock,
    });
  }
  return { product, warehouse };
};

const orderFor = async (
  product: { _id: mongoose.Types.ObjectId; name: string; stock: number },
  allocation: mongoose.Types.ObjectId | null,
  status: string
) =>
  Order.create({
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
    paymentMethod: "cash",
    paymentStatus: "paid",
    orderStatus: status,
    subtotal: 200,
    totalAmount: 200,
    warehouse: allocation,
  });
describe("schema indexes actually build", () => {
  it("resolves Product.init()", async () => {
    // This used to throw: `colorSchema` and `variantSchema` each declared a
    // text index, and both are *embedded* in Product — so two text indexes
    // landed on one collection, which MongoDB rejects. `db.ts` swallowed the
    // failure, so it was invisible in production and no Product index was ever
    // built. A schema that cannot build its indexes is a collection that scans.
    await assert.doesNotReject(() => Product.init());
  });

  it("leaves at most one text index on Product", async () => {
    await Product.init();
    const indexes = await Product.collection.indexes();
    const text = indexes.filter((i) => i.key?._fts === "text");

    assert.ok(
      text.length <= 1,
      `Product has ${text.length} text indexes (${text
        .map((i) => i.name)
        .join(", ")}); MongoDB allows one per collection`
    );
  });

  it("still builds the indexes the schema does declare", async () => {
    await Product.init();
    const names = (await Product.collection.indexes()).map((i) => i.name);

    // If `init()` resolves but these are missing, the conflict is back and
    // merely reporting differently.
    assert.ok(
      names.some((n) => (n ?? "").includes("isActive_1_createdAt")),
      `expected the declared indexes, got: ${names.join(", ")}`
    );
  });
});

describe("indexes fail safe", () => {
  it("createIndexes never drops an index the schema does not declare", async () => {
    // `db.ts` used `syncIndexes()`, which deletes any index not in the schema —
    // so one incomplete schema could remove a unique constraint on boot, after
    // which duplicates get written. The failure modes are not symmetric:
    // a missing index makes queries slow; a dropped one can corrupt data.
    await Product.init();

    // An index nobody declared, as a hand-tuned or legacy one would be.
    await Product.collection.createIndex({ legacyField: 1 }, { name: "legacy_1" });
    assert.ok(
      (await Product.collection.indexes()).some((i) => i.name === "legacy_1")
    );

    // This is what `connectDB` now does.
    await Product.createIndexes();

    const after = await Product.collection.indexes();
    assert.ok(
      after.some((i) => i.name === "legacy_1"),
      "an undeclared index must survive a boot"
    );
    assert.ok(
      after.some((i) => (i.name ?? "").includes("isActive_1_createdAt")),
      "while the declared ones are still created"
    );
  });
});

describe("npm run reconcile", () => {
  it("reports nothing when the catalogue matches the ledger", async () => {
    await fixture(10);
    const result = await reconcileStock({ log: quiet });
    assert.equal(result.drift.length, 0);
  });

  it("finds drift without changing anything by default", async () => {
    const { product } = await fixture(10);
    // A hand-edited catalogue, which is exactly what reconcile exists to catch.
    await Product.updateOne({ _id: product._id }, { $set: { stock: 3 } });

    const result = await reconcileStock({ log: quiet });

    assert.equal(result.drift.length, 1);
    assert.equal(result.corrected, 0, "read-only unless asked");
    const unchanged = await Product.findById(product._id).lean();
    assert.equal(unchanged?.stock, 3, "still wrong until --fix");
  });

  it("corrects the catalogue and writes NO movement", async () => {
    // The bug this pins: `--fix` used to log an `adjust` row for a change it
    // made only to `Product.stock`. That put a movement into the audit trail
    // for something the ledger never did — and the next reconcile would then
    // "correct" the catalogue straight back, because the phantom movement
    // implies the product really did change.
    const { product } = await fixture(10);
    await Product.updateOne({ _id: product._id }, { $set: { stock: 3 } });

    const before = await StockMovement.countDocuments();
    const result = await reconcileStock({ fix: true, log: quiet });

    assert.equal(result.corrected, 1);
    assert.equal(result.movementsWritten, 0);

    const fixed = await Product.findById(product._id).lean();
    assert.equal(fixed?.stock, 10, "matched to the ledger");

    const after = await StockMovement.countDocuments();
    assert.equal(after, before, "the ledger gained nothing");
  });

  it("is stable: a second run finds no drift", async () => {
    // The property that proves the first run was honest. If it had written a
    // phantom movement, this would report drift again.
    const { product } = await fixture(10);
    await Product.updateOne({ _id: product._id }, { $set: { stock: 3 } });

    await reconcileStock({ fix: true, log: quiet });
    const second = await reconcileStock({ log: quiet });

    assert.equal(second.drift.length, 0, "it converges, and stays put");
  });

  it("ignores a pending order as drift", async () => {
    // Pending orders legitimately make on-shelf quantity differ from
    // availability, so comparing the wrong figure would flag every open order.
    const { product, warehouse } = await fixture(10);
    await reserve([
      { product: product._id, warehouse: warehouse._id, quantity: 4 },
    ]);
    await Product.updateOne({ _id: product._id }, { $set: { stock: 6 } });

    const result = await reconcileStock({ log: quiet });
    assert.equal(result.drift.length, 0, "6 available, 6 in the catalogue");
  });
});

describe("npm run repair:reservations", () => {
  it("does nothing when there are no fulfilled orders", async () => {
    await fixture(10);
    const result = await repairStrandedReservations({ log: quiet });
    assert.equal(result.fulfilled, 0);
    assert.equal(result.cleared, 0);
  });

  it("finds a hold stranded by a pre-fix shipment, and changes nothing first", async () => {
    // The `out` that used to stand in for `commit`: units gone, hold left behind.
    const { product, warehouse } = await fixture(10);
    await orderFor(product, warehouse._id as mongoose.Types.ObjectId, "shipped");
    await Inventory.updateOne(
      { product: product._id, warehouse: warehouse._id },
      { $set: { quantity: 8, reserved: 2 } }
    );

    const result = await repairStrandedReservations({ log: quiet });
    assert.equal(result.stranded, 1);
    assert.equal(result.cleared, 0, "read-only unless asked");

    const untouched = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    }).lean();
    assert.equal(untouched?.reserved, 2, "still stranded until --fix");
  });
  it("clears the hold with a real release movement", async () => {
    const { product, warehouse } = await fixture(10);
    const order = await orderFor(
      product,
      warehouse._id as mongoose.Types.ObjectId,
      "shipped"
    );
    await Inventory.updateOne(
      { product: product._id, warehouse: warehouse._id },
      { $set: { quantity: 8, reserved: 2 } }
    );

    const result = await repairStrandedReservations({ fix: true, log: quiet });
    assert.equal(result.cleared, 1);

    const repaired = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    }).lean();
    assert.equal(repaired?.reserved, 0, "the phantom hold is gone");
    assert.equal(repaired?.quantity, 8, "and the units were not resurrected");

    // A silent $inc would fix the number and leave no trace. The ledger has to
    // show why, and against which order.
    const movement = await StockMovement.findOne({
      reference: order.orderNumber ?? "",
      type: "release",
    }).lean();
    assert.ok(movement, "the repair is auditable");
  });

  it("skips an order that already has a commit movement", async () => {
    const { product, warehouse } = await fixture(10);
    const order = await orderFor(
      product,
      warehouse._id as mongoose.Types.ObjectId,
      "shipped"
    );
    // A *properly* settled order: held at checkout, then committed on dispatch.
    // The commit movement is the proof the hold was cleared, so the repair must
    // leave it alone.
    await reserve([
      { product: product._id, warehouse: warehouse._id, quantity: 2 },
    ]);
    await applyMovement("commit", {
      product: product._id,
      warehouse: warehouse._id,
      quantity: 2,
      reference: order.orderNumber ?? "",
    });

    const row = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    }).lean();
    assert.equal(row?.reserved, 0, "already settled");

    const result = await repairStrandedReservations({ fix: true, log: quiet });
    assert.equal(result.stranded, 0, "and left alone");
  });

  it("reports an unstamped order rather than guessing", async () => {
    // No allocation means no way to know which row held the units. Taking the
    // current default instead would credit a warehouse that never held them.
    const { product, warehouse } = await fixture(10);
    await orderFor(product, null, "shipped");
    await Inventory.updateOne(
      { product: product._id, warehouse: warehouse._id },
      { $set: { quantity: 8, reserved: 2 } }
    );

    const result = await repairStrandedReservations({ fix: true, log: quiet });
    assert.equal(result.unstamped, 1);
    assert.equal(result.cleared, 0, "refused rather than guessed");

    const untouched = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    }).lean();
    assert.equal(untouched?.reserved, 2);
  });

  it("never drives reserved below zero", async () => {
    const { product, warehouse } = await fixture(10);
    await orderFor(
      product,
      warehouse._id as mongoose.Types.ObjectId,
      "delivered"
    );
    // The order says 2, but only 1 is genuinely still held.
    await Inventory.updateOne(
      { product: product._id, warehouse: warehouse._id },
      { $set: { quantity: 9, reserved: 1 } }
    );

    await repairStrandedReservations({ fix: true, log: quiet });

    const row = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    }).lean();
    assert.equal(row?.reserved, 0, "clamped, not driven negative");
  });
});

describe("npm run backfill:deltas", () => {
  it("does nothing when every row already has one", async () => {
    await fixture(5);
    const result = await backfillMovementDeltas({ log: quiet });
    assert.equal(result.legacy, 0);
  });

  it("refuses to guess the direction of an old transfer row", async () => {
    // Under the old vocabulary, `transfer` encoded direction in a sign the
    // schema rejected — so nothing on the row can say which side it was.
    await fixture(5);
    await StockMovement.collection.insertOne({
      product: new mongoose.Types.ObjectId(),
      warehouse: new mongoose.Types.ObjectId(),
      type: "transfer",
      quantity: 3,
      reference: "TRF-OLD",
    });

    const result = await backfillMovementDeltas({ fix: true, log: quiet });
    assert.equal(result.unrecoverable.length, 1);
    assert.equal(result.written, 0, "reported, not invented");

    const row = await StockMovement.findOne({ reference: "TRF-OLD" }).lean();
    assert.equal(row?.delta, undefined, "left untouched");
  });

  it("derives a delta for a type that carries one", async () => {
    const { product, warehouse } = await fixture(3);
    const row = await StockMovement.findOne({
      product: product._id,
      warehouse: warehouse._id,
      type: "in",
    }).lean();

    // Simulate a row written before the column existed.
    await StockMovement.collection.updateOne(
      { _id: row?._id },
      { $unset: { delta: "" } }
    );

    const result = await backfillMovementDeltas({ fix: true, log: quiet });
    assert.equal(result.written, 1);

    const fixed = await StockMovement.findOne({ _id: row?._id }).lean();
    assert.equal(fixed?.delta, 3);
  });

  it("is read-only by default", async () => {
    const { product, warehouse } = await fixture(4);
    const row = await StockMovement.findOne({
      product: product._id,
      warehouse: warehouse._id,
      type: "in",
    }).lean();
    await StockMovement.collection.updateOne(
      { _id: row?._id },
      { $unset: { delta: "" } }
    );

    const result = await backfillMovementDeltas({ log: quiet });
    assert.equal(result.legacy, 1);
    assert.equal(result.written, 0);

    const untouched = await StockMovement.findOne({ _id: row?._id }).lean();
    assert.equal(untouched?.delta, undefined);
  });
});
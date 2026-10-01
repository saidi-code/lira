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
import { MongoMemoryServer } from "mongodb-memory-server";

import Inventory from "../models/Inventory.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import StockMovement from "../models/StockMovement.js";
import Warehouse from "../models/Warehouse.js";
import { applyMovement, release, reserve } from "../services/inventoryService.js";
import { reconcileStock } from "../scripts/reconcileStock.js";
import { backfillMovementDeltas } from "../scripts/backfillMovementDeltas.js";
import { repairStrandedReservations } from "../scripts/repairStrandedReservations.js";

let mongod: MongoMemoryServer;
const quiet = () => undefined;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Product.init();
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
// scripts/seedWarehouses.ts
// ==========================================
// Creates the default warehouse and gives every product an inventory row.
//
// AGENT.md §11 documents `npm run seed:warehouses`; this is it. Run it once
// before touching /inventory, otherwise `getDefaultWarehouse()` throws by design.
//
//   npm run seed:warehouses
//
// Idempotent: re-running tops nothing up, it only fills in what is missing.
// Existing quantities are never overwritten — that is an `adjust` with a reason.
// ==========================================
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Products.js";
import Warehouse from "../models/Warehouse.js";
import { applyMovement } from "../services/inventoryService.js";

const DEFAULT_WAREHOUSE = {
  name: "Main Warehouse",
  code: "MAIN",
  address: {
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Tunisia",
  },
  isActive: true,
  isDefault: true,
};

/** Default reorder level for products seeded without one. */
const DEFAULT_REORDER_LEVEL = 2;

const main = async () => {
  await connectDB();

  // ---------- warehouse ----------
  let warehouse = await Warehouse.findOne({ code: DEFAULT_WAREHOUSE.code });

  if (warehouse) {
    console.log(`Warehouse ${warehouse.code} already exists — reusing.`);
  } else {
    warehouse = await Warehouse.create(DEFAULT_WAREHOUSE);
    console.log(`Created warehouse ${warehouse.name} (${warehouse.code}).`);
  }

  // ---------- inventory rows ----------
  const products = await Product.find().select("_id name stock").lean();
  console.log(`Seeding inventory for ${products.length} product(s)…`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    const existing = await Inventory.findOne({
      product: product._id,
      warehouse: warehouse._id,
    });

    if (existing) {
      skipped++;
      continue;
    }

    // `stock` is the catalogue's denormalised figure; the ledger starts from it so
    // both agree until a real movement moves them apart (reconcileStock).
    const quantity = Number(product.stock) || 0;

    // Created empty on purpose: the stock is then *moved in* through the service
    // below, so the opening balance is a real `in` movement with a derived
    // `delta`. Creating it pre-filled and then applying the movement would
    // double the opening quantity.
    await Inventory.create({
      product: product._id,
      warehouse: warehouse._id,
      quantity: 0,
      reserved: 0,
      reorderLevel: DEFAULT_REORDER_LEVEL,
    });

    // A zero-quantity import is skipped — `applyMovement` rejects non-positive
    // movements, and "zero units arrived" is not a fact worth recording.
    if (quantity > 0) {
      await applyMovement("in", {
        product: product._id as mongoose.Types.ObjectId,
        warehouse: warehouse._id as mongoose.Types.ObjectId,
        quantity,
        reference: "seed",
        note: "Initial import from Product.stock",
      });
    }

    created++;
  }

  console.log(
    `Done. ${created} inventory row(s) created, ${skipped} already existed.`
  );
  console.log(
    "StockMovement rows were written for each import — the ledger starts here."
  );

  await Inventory.db.close();
  process.exit(0);
};

main().catch(async (error) => {
  console.error("seed:warehouses failed:", error);
  await Inventory.db.close().catch(() => undefined);
  process.exit(1);
});
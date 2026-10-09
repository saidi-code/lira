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
import SkuInventory from "../models/SkuInventory.js";
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
  const products = await Product.find().select("_id name stock sku type colors").lean();
  console.log(`Seeding inventory for ${products.length} product(s)…`);

  let created = 0;
  let skipped = 0;

  for (const product of products) {
    // Existing product-level inventory is preserved and must go through the
    // explicit previewed SKU migration; seeding beside it would duplicate stock.
    const legacy = await Inventory.exists({ product: product._id });
    if (legacy) {
      skipped++;
      continue;
    }

    const items = product.type === "variable"
      ? (product.colors ?? []).flatMap((color: any) =>
          (color.variants ?? []).map((variant: any) => ({
            sku: String(variant.sku ?? "").trim(),
            quantity: Number(variant.stock) || 0,
          }))
        )
      : [{ sku: String(product.sku ?? "").trim(), quantity: Number(product.stock) || 0 }];

    for (const item of items) {
      if (!item.sku) {
        console.warn(`Skipping ${product.name}: a sellable item has no SKU.`);
        continue;
      }
      if (await SkuInventory.exists({ product: product._id, sku: item.sku, warehouse: warehouse._id })) {
        skipped++;
        continue;
      }
      await SkuInventory.create({
        product: product._id,
        sku: item.sku,
        warehouse: warehouse._id,
        quantity: 0,
        reserved: 0,
        reorderLevel: DEFAULT_REORDER_LEVEL,
      });

      if (item.quantity > 0) {
      await applyMovement("in", {
        product: product._id as mongoose.Types.ObjectId,
        sku: item.sku,
        warehouse: warehouse._id as mongoose.Types.ObjectId,
        quantity: item.quantity,
        reference: "seed",
        note: "Initial import from product SKU stock",
      });
      }
      created++;
    }
  }

  console.log(
    `Done. ${created} SKU inventory row(s) created, ${skipped} were preserved/skipped.`
  );
  console.log(
    "StockMovement rows were written for each import — the ledger starts here."
  );

  await SkuInventory.db.close();
  process.exit(0);
};

main().catch(async (error) => {
  console.error("seed:warehouses failed:", error);
  await SkuInventory.db.close().catch(() => undefined);
  process.exit(1);
});

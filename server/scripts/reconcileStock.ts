// scripts/reconcileStock.ts
// ==========================================
// Nightly reconciliation (AGENT.md §9). `Product.stock` is a denormalised
// convenience for the catalogue; the ledger in `Inventory` + `StockMovement` is
// the truth. Drift between them means a write bypassed the service.
//
//   npm run reconcile            report only
//   npm run reconcile -- --fix   correct Product.stock to the ledger
//
// Read-only by default: silently rewriting a figure nobody asked to change is
// how a real discrepancy gets hidden. `--fix` corrects the *catalogue* to the
// ledger and deliberately writes no movement — see the note in the loop.
// ==========================================
import "dotenv/config";
import connectDB from "../config/db.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Products.js";
import { findDrift } from "../services/reconcileService.js";

const main = async () => {
  const fix = process.argv.includes("--fix");

  await connectDB();

  // One row per product: availability across every warehouse (§9 step 1).
  // Σ(quantity − reserved), because that is what `Product.stock` now means —
  // comparing against on-shelf quantity would flag every pending order as drift.
  const summed = await Inventory.aggregate<{
    _id: unknown;
    ledger: number;
  }>([
    {
      $group: {
        _id: "$product",
        ledger: { $sum: { $subtract: ["$quantity", "$reserved"] } },
      },
    },
  ]);

  const ledgerByProduct = new Map(
    summed.map((row) => [String(row._id), row.ledger])
  );

  const products = await Product.find().select("_id name stock").lean();
  const warehouses = new Set(
    (await Inventory.distinct("warehouse")).map(String)
  );

  console.log(
    `Reconciling ${products.length} product(s) across ${warehouses.size} warehouse(s)…`
  );

  const drift = findDrift(
    products.map((product) => ({
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
      },
      ledger: ledgerByProduct.get(String(product._id)) ?? 0,
    }))
  );

  if (drift.length === 0) {
    console.log("No drift — catalogue matches the ledger.");
    await Inventory.db.close();
    process.exit(0);
  }

  console.log(`\n${drift.length} product(s) out of sync:\n`);
  for (const row of drift) {
    console.log(
      `  ${row.name || row.productId}: catalogue=${row.catalogue} ledger=${row.ledger} delta=${row.delta > 0 ? "+" : ""}${row.delta}`
    );
  }

  if (!fix) {
    console.log("\nRe-run with --fix to correct Product.stock to the ledger.");
    await Inventory.db.close();
    process.exit(2);
  }

  console.log("\nCorrecting…");
  for (const row of drift) {
    await Product.updateOne({ _id: row.productId }, { $set: { stock: row.ledger } });

    // Deliberately NO StockMovement here.
    //
    // This pass only rewrites the denormalised catalogue figure; the
    // `Inventory` rows were already right, and the ledger is the source of
    // truth. Writing an `adjust` row would put a movement into the audit trail
    // for a change that never happened to the ledger — and the next reconcile
    // would then "correct" the catalogue back, because the phantom movement
    // would imply the product really did change.
    console.log(
      `  ${row.name || row.productId}: stock ${row.catalogue} → ${row.ledger} (catalogue only; no movement written)`
    );
  }

  console.log(`Corrected ${drift.length} product(s).`);
  await Inventory.db.close();
  process.exit(0);
};

main().catch(async (error) => {
  console.error("reconcile failed:", error);
  await Inventory.db.close().catch(() => undefined);
  process.exit(1);
});
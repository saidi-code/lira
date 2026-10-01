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
// how a real discrepancy gets hidden. `--fix` writes an `adjust` row so the
// correction is itself auditable.
// ==========================================
import "dotenv/config";
import connectDB from "../config/db.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Products.js";
import StockMovement from "../models/StockMovement.js";
import { findDrift } from "../services/reconcileService.js";

const main = async () => {
  const fix = process.argv.includes("--fix");

  await connectDB();

  // One row per product: sum across every warehouse (§9 step 1).
  const summed = await Inventory.aggregate<{
    _id: unknown;
    ledger: number;
  }>([
    { $group: { _id: "$product", ledger: { $sum: "$quantity" } } },
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

    // The correction is itself a movement, so the ledger stays explainable.
    const warehouse = await Inventory.findOne({ product: row.productId });
    if (warehouse) {
      await StockMovement.create({
        product: row.productId,
        warehouse: warehouse._id,
        type: "adjust",
        quantity: Math.abs(row.delta),
        reference: "reconcile",
        note: `Catalogue corrected to ledger (${row.catalogue} → ${row.ledger})`,
      });
    }
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
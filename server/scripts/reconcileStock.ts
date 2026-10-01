// scripts/reconcileStock.ts
// ==========================================
// NIGHTLY RECONCILIATION (AGENT.md §9)
// ==========================================
//   npm run reconcile            report only
//   npm run reconcile -- --fix   correct Product.stock to the ledger
//
// Read-only by default: silently rewriting a figure nobody asked to change is
// how a real discrepancy gets hidden. `--fix` corrects the *catalogue* to the
// ledger and deliberately writes no movement — see the loop.
//
// The work is exported as `reconcileStock()` rather than buried in a `main()`
// that runs on import, so the integration suite can execute this against a real
// database. A nightly job that has never been run is not a job.
// ==========================================
import "dotenv/config";
import connectDB from "../config/db.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Products.js";
import { findDrift, type DriftRow } from "../services/reconcileService.js";

export interface ReconcileResult {
  products: number;
  warehouses: number;
  drift: DriftRow[];
  /** Rows corrected — always 0, because `--fix` writes no movement. */
  corrected: number;
  movementsWritten: number;
}

export interface ReconcileOptions {
  fix?: boolean;
  log?: (message: string) => void;
}

export const reconcileStock = async ({
  fix = false,
  log = console.log,
}: ReconcileOptions = {}): Promise<ReconcileResult> => {
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

  log(
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
    log("No drift — catalogue matches the ledger.");
    return {
      products: products.length,
      warehouses: warehouses.size,
      drift,
      corrected: 0,
      movementsWritten: 0,
    };
  }

  log(`\n${drift.length} product(s) out of sync:\n`);
  for (const row of drift) {
    log(
      `  ${row.name || row.productId}: catalogue=${row.catalogue} ledger=${row.ledger} delta=${row.delta > 0 ? "+" : ""}${row.delta}`
    );
  }

  if (!fix) {
    log("\nRe-run with --fix to correct Product.stock to the ledger.");
    return {
      products: products.length,
      warehouses: warehouses.size,
      drift,
      corrected: 0,
      movementsWritten: 0,
    };
  }

  log("\nCorrecting…");
  for (const row of drift) {
    await Product.updateOne({ _id: row.productId }, { $set: { stock: row.ledger } });
    log(
      `  ${row.name || row.productId}: stock ${row.catalogue} → ${row.ledger} (catalogue only; no movement written)`
    );
  }

  log(`Corrected ${drift.length} product(s).`);
  return {
    products: products.length,
    warehouses: warehouses.size,
    drift,
    corrected: drift.length,
    movementsWritten: 0,
  };
};

const main = async () => {
  const fix = process.argv.includes("--fix");
  await connectDB();

  try {
    const result = await reconcileStock({ fix });
    // Non-zero when drift was found but not fixed: a cron that only ever exits 0
    // cannot page anyone.
    process.exit(result.drift.length > 0 && !fix ? 2 : 0);
  } finally {
    await Inventory.db.close();
  }
};

// Only run when executed directly, so importing this for a test is inert.
if (process.argv[1]?.includes("reconcileStock")) {
  main().catch(async (error) => {
    console.error("reconcile failed:", error);
    await Inventory.db.close().catch(() => undefined);
    process.exit(1);
  });
}
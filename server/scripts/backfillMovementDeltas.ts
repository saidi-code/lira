// scripts/backfillMovementDeltas.ts
// ==========================================
// ONE-OFF BACKFILL
// ==========================================
// `StockMovement.delta` was added after the ledger went live, so historical rows
// have no `delta` and would now fail validation if anything re-saved them.
//
//   npm run backfill:deltas          report only
//   npm run backfill:deltas -- --fix write the derived values
//
// Rows written under the old `transfer` type are reported as unrecoverable
// rather than guessed at: their direction lived only in a sign the schema
// rejected, so nothing on the row can say which warehouse they left or arrived
// at. A wrong guess would corrupt the audit trail silently.
//
// Read-only by default, for the same reason as every other script here.
// ==========================================
import "dotenv/config";
import connectDB from "../config/db.js";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import { recoverableDelta } from "../services/reconcileService.js";
import { isDirectRun } from "../utils/isDirectRun.js";

export interface BackfillResult {
  legacy: number;
  written: number;
  /** Rows whose direction was never stored, and so cannot be derived. */
  unrecoverable: string[];
}

export interface BackfillOptions {
  fix?: boolean;
  log?: (message: string) => void;
}

export const backfillMovementDeltas = async ({
  fix = false,
  log = console.log,
}: BackfillOptions = {}): Promise<BackfillResult> => {
  const legacy = await StockMovement.find({
    $or: [{ delta: { $exists: false } }, { delta: null }],
  })
    .select("_id type quantity reference")
    .lean();

  if (legacy.length === 0) {
    log("Every movement already records a delta — nothing to do.");
    return { legacy: 0, written: 0, unrecoverable: [] };
  }

  log(`Found ${legacy.length} movement(s) without a delta.\n`);

  const unrecoverable: string[] = [];
  const recoverable: Array<(typeof legacy)[number] & { delta: number }> = [];

  for (const row of legacy) {
    const delta = recoverableDelta(row.type, row.quantity);
    if (delta === null) {
      unrecoverable.push(String(row._id));
    } else {
      recoverable.push({ ...row, delta });
    }
  }

  for (const row of recoverable.slice(0, 20)) {
    log(
      `  ${row.type} ${row.quantity} → delta ${row.delta}` +
        (row.reference ? ` (${row.reference})` : "")
    );
  }
  if (recoverable.length > 20) {
    log(`  … and ${recoverable.length - 20} more`);
  }

  if (unrecoverable.length) {
    log(
      `\n${unrecoverable.length} row(s) are NOT recoverable — these were written ` +
        "under the old `transfer` type, whose direction was never stored:"
    );
    for (const id of unrecoverable) {
      log(`  ${id}`);
    }
    log(
      "  Reconstruct these by hand from the pair of rows sharing a reference."
    );
  }

  if (!fix) {
    log(`\nRe-run with --fix to write ${recoverable.length} delta(s).`);
    return { legacy: legacy.length, written: 0, unrecoverable };
  }

  log("\nWriting…");
  for (const row of recoverable) {
    await StockMovement.updateOne(
      { _id: row._id },
      { $set: { delta: row.delta } }
    );
  }

  log(`Backfilled ${recoverable.length} delta(s).`);
  if (unrecoverable.length) {
    log(`${unrecoverable.length} row(s) left untouched — see the list above.`);
  }

  return {
    legacy: legacy.length,
    written: recoverable.length,
    unrecoverable,
  };
};

const main = async () => {
  const fix = process.argv.includes("--fix");
  await connectDB();

  try {
    const result = await backfillMovementDeltas({ fix });
    process.exit(result.legacy > 0 && !fix ? 2 : 0);
  } finally {
    await Inventory.db.close();
  }
};

// Only run when executed directly, so importing this for a test is inert.
if (isDirectRun("backfillMovementDeltas")) {
  main().catch(async (error) => {
    console.error("backfill:deltas failed:", error);
    await Inventory.db.close().catch(() => undefined);
    process.exit(1);
  });
}
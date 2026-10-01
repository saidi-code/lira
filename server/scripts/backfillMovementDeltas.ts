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

const main = async () => {
  const fix = process.argv.includes("--fix");

  await connectDB();

  const legacy = await StockMovement.find({
    $or: [{ delta: { $exists: false } }, { delta: null }],
  })
    .select("_id type quantity reference product warehouse")
    .lean();

  if (legacy.length === 0) {
    console.log("Every movement already records a delta — nothing to do.");
    await Inventory.db.close();
    process.exit(0);
  }

  console.log(`Found ${legacy.length} movement(s) without a delta.\n`);

  const unrecoverable: typeof legacy = [];
  const recoverable: Array<(typeof legacy)[number] & { delta: number }> = [];

  for (const row of legacy) {
    const delta = recoverableDelta(row.type, row.quantity);
    if (delta === null) {
      unrecoverable.push(row);
    } else {
      recoverable.push({ ...row, delta });
    }
  }

  for (const row of recoverable.slice(0, 20)) {
    console.log(
      `  ${row.type} ${row.quantity} → delta ${row.delta}` +
        (row.reference ? ` (${row.reference})` : "")
    );
  }
  if (recoverable.length > 20) {
    console.log(`  … and ${recoverable.length - 20} more`);
  }

  if (unrecoverable.length) {
    console.log(
      `\n${unrecoverable.length} row(s) are NOT recoverable — these were written ` +
        "under the old `transfer` type, whose direction was never stored:"
    );
    for (const row of unrecoverable) {
      console.log(`  ${row._id} (${row.reference || "no reference"})`);
    }
    console.log(
      "  Reconstruct these by hand from the pair of rows sharing a reference."
    );
  }

  if (!fix) {
    console.log(`\nRe-run with --fix to write ${recoverable.length} delta(s).`);
    await Inventory.db.close();
    process.exit(2);
  }

  console.log("\nWriting…");
  for (const row of recoverable) {
    await StockMovement.updateOne(
      { _id: row._id },
      { $set: { delta: row.delta } }
    );
  }

  console.log(`Backfilled ${recoverable.length} delta(s).`);
  if (unrecoverable.length) {
    console.log(
      `${unrecoverable.length} row(s) left untouched — see the list above.`
    );
  }

  await Inventory.db.close();
  process.exit(0);
};

main().catch(async (error) => {
  console.error("backfill:deltas failed:", error);
  await Inventory.db.close().catch(() => undefined);
  process.exit(1);
});
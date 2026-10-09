// scripts/repairStrandedReservations.ts
// ==========================================
// ONE-OFF REPAIR
// ==========================================
// `commit` used to be folded into `out`, which took the units off the shelf but
// left the hold behind. Every order shipped before that fix therefore has stock
// marked as reserved that is physically gone: those units can never be sold, and
// `npm run reconcile` cannot report them, because a stranded hold makes both
// sides of its availability comparison wrong by the same amount.
//
//   npm run repair:reservations          report only
//   npm run repair:reservations -- --fix clear the stranded holds
//
// Read-only by default. The decision rules live in `reconcileService` so they
// are unit-tested; this file is only the I/O around them.
// ==========================================
import "dotenv/config";
import connectDB from "../config/db.js";
import SkuInventory from "../models/SkuInventory.js";
import Order from "../models/Order.js";
import StockMovement from "../models/StockMovement.js";
import { applyMovement } from "../services/inventoryService.js";
import { strandedReservations } from "../services/reconcileService.js";
import { isDirectRun } from "../utils/isDirectRun.js";

export interface RepairResult {
  fulfilled: number;
  /** Fulfilled orders with no warehouse stamp — cannot be resolved. */
  unstamped: number;
  stranded: number;
  cleared: number;
}

export interface RepairOptions {
  fix?: boolean;
  log?: (message: string) => void;
}

export const repairStrandedReservations = async ({
  fix = false,
  log = console.log,
}: RepairOptions = {}): Promise<RepairResult> => {
  // Orders whose units have left the building. `warehouse` is the allocation
  // stamped at checkout; without it we cannot know which row held the units, so
  // those are reported and skipped rather than guessed at.
  const orders = await Order.find({
    orderStatus: { $in: ["shipped", "delivered"] },
  })
    .select("orderNumber orderStatus warehouse items")
    .lean();

  const none: RepairResult = {
    fulfilled: 0,
    unstamped: 0,
    stranded: 0,
    cleared: 0,
  };

  if (orders.length === 0) {
    log("No fulfilled orders — nothing to repair.");
    return none;
  }

  const unstampedOrders = orders.filter((order) => !order.warehouse);
  if (unstampedOrders.length) {
    log(
      `${unstampedOrders.length} fulfilled order(s) have no recorded warehouse and ` +
        "cannot be repaired automatically (they predate the allocation stamp):"
    );
    for (const order of unstampedOrders) {
      log(`  ${order.orderNumber ?? order._id} — no warehouse stamp`);
    }
    log("");
  }

  const candidates = [];

  for (const order of orders) {
    if (!order.warehouse) continue;

    const lines = [];
    for (const item of order.items) {
      const row = await SkuInventory.findOne({
        product: item.product,
        sku: item.sku,
        warehouse: order.warehouse,
      }).select("reserved");
      lines.push({
        product: String(item.product),
        sku: item.sku ?? undefined,
        name: item.name,
        quantity: item.quantity,
        reservedAtWarehouse: row?.reserved ?? 0,
      });
    }

    // A `commit` movement is the proof the hold was already settled properly.
    const hasCommitMovement = Boolean(
      await StockMovement.exists({
        reference: order.orderNumber ?? "",
        type: "commit",
      })
    );

    candidates.push({
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      warehouse: String(order.warehouse),
      status: order.orderStatus ?? "",
      lines,
      hasCommitMovement,
    });
  }

  const stranded = strandedReservations(candidates);

  if (stranded.length === 0) {
    log("No stranded reservations found — the ledger is consistent.");
    return {
      fulfilled: orders.length,
      unstamped: unstampedOrders.length,
      stranded: 0,
      cleared: 0,
    };
  }

  log(`\n${stranded.length} order(s) with stranded reservations:\n`);
  for (const order of stranded) {
    const detail = order.lines
      .map((line) => `${line.quantity} × ${line.name}`)
      .join(", ");
    log(`  ${order.orderNumber}: ${detail}`);
  }

  if (!fix) {
    log("\nRe-run with --fix to clear these holds.");
    return {
      fulfilled: orders.length,
      unstamped: unstampedOrders.length,
      stranded: stranded.length,
      cleared: 0,
    };
  }

  log("\nClearing stranded holds…");
  let cleared = 0;

  for (const order of stranded) {
    for (const line of order.lines) {
      // A `release` movement, not a silent $inc: the hold genuinely is being
      // given back, and the audit trail should say so against this order.
      await applyMovement("release", {
        product: line.product,
        sku: line.sku,
        warehouse: order.warehouse,
        quantity: line.quantity,
        reference: order.orderNumber,
        note: "Stranded reservation from a pre-fix shipment",
      });
      cleared++;
    }
  }

  log(
    `Cleared ${cleared} stranded hold(s) across ${stranded.length} order(s).`
  );
  return {
    fulfilled: orders.length,
    unstamped: unstampedOrders.length,
    stranded: stranded.length,
    cleared,
  };
};

const main = async () => {
  const fix = process.argv.includes("--fix");
  await connectDB();

  try {
    const result = await repairStrandedReservations({ fix });
    process.exit(result.stranded > 0 && !fix ? 2 : 0);
  } finally {
    await SkuInventory.db.close();
  }
};

// Only run when executed directly, so importing this for a test is inert.
if (isDirectRun("repairStrandedReservations")) {
  main().catch(async (error) => {
    console.error("repair:reservations failed:", error);
    await SkuInventory.db.close().catch(() => undefined);
    process.exit(1);
  });
}


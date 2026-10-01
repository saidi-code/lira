// services/inventoryService.ts
// ==========================================
// THE INVENTORY LEDGER (AGENT.md §9)
// ==========================================
// Every stock change goes through here and leaves a `StockMovement` row. Nothing
// in the codebase is allowed to `$inc` a product's stock without one.
//
//   reserve  order placed        holds units, quantity untouched
//   release  cancel / expired    gives the hold back
//   commit   order fulfilled     held units leave the shelf *and* the hold
//   in       PO receive, restock units arrive
//   out      direct removal      units leave for another reason
//   adjust   manual correction   signed delta, always explained
//
// `available = quantity - reserved` (§9): what a new customer can actually buy.
//
// The rules below are deliberately pure and exported so they can be unit-tested
// without a database — see tests/inventory.test.ts.
// ==========================================
import mongoose, { ClientSession } from "mongoose";
import Inventory from "../models/Inventory.js";
import StockMovement, {
  MOVEMENT_TYPES,
  movementDeltasFor,
  type MovementType,
  type StockDelta,
} from "../models/StockMovement.js";
import Warehouse from "../models/Warehouse.js";

export { movementDeltasFor as movementDeltas };
export type { StockDelta };

/** Raised when a movement would drive stock below zero. */
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

/** Units a customer can still buy at this inventory row (§9). */
export const available = (row: { quantity: number; reserved: number }): number =>
  row.quantity - row.reserved;

/**
 * The predicate that makes a movement safe under concurrency (§9).
 *
 * This is what turns a read-then-write into a single atomic operation: the guard
 * travels *into* the update, so two concurrent movements of the same product
 * cannot both pass a stale read. A movement that finds no matching row failed its
 * guard, which is what `InsufficientStockError` reports.
 */
export const guardFilter = (
  type: MovementType,
  quantity: number
): Record<string, unknown> => {
  switch (type) {
    case "in":
    case "transfer_in":
      // Arriving stock cannot overshoot.
      return {};

    case "out":
    case "transfer_out":
      return { quantity: { $gte: quantity } };

    case "commit":
      // Both halves must be available: the units are on the shelf (`quantity`)
      // and genuinely held for this order (`reserved`).
      return {
        quantity: { $gte: quantity },
        reserved: { $gte: quantity },
      };

    case "release":
      return { reserved: { $gte: quantity } };

    case "reserve":
      // Holding `quantity` more requires available >= quantity, i.e.
      // reserved <= quantity - quantity. Written as $expr so the check happens
      // atomically inside the update rather than as a separate read.
      return {
        $expr: { $lte: ["$reserved", { $subtract: ["$quantity", quantity] }] },
      };

    case "adjust": {
      // `quantity` is a signed delta here: only a correction that removes stock
      // needs a floor.
      if (quantity >= 0) return {};
      return { quantity: { $gte: -quantity } };
    }
  }
};

/** Invariant §11.4 — the belt to `guardFilter`'s braces. */
export const assertInvariants = (
  next: { quantity: number; reserved: number }
): void => {
  if (next.quantity < 0) {
    throw new InsufficientStockError(`Quantity cannot go below zero`);
  }
  if (next.reserved < 0) {
    throw new InsufficientStockError(`Reserved cannot go below zero`);
  }
  if (next.reserved > next.quantity) {
    throw new InsufficientStockError(
      `Reserved (${next.reserved}) cannot exceed quantity (${next.quantity})`
    );
  }
};

export interface MovementInput {
  product: mongoose.Types.ObjectId | string;
  warehouse: mongoose.Types.ObjectId | string;
  /** Positive for every type except `adjust`, which takes a signed delta. */
  quantity: number;
  reference?: string;
  user?: mongoose.Types.ObjectId | string | null;
  note?: string;
}

/**
 * The single write path: guard, apply, record — in that order, in one session
 * when one is supplied.
 *
 * Returns what is left afterwards so callers can report the real figure rather
 * than assuming the movement succeeded.
 */
export const applyMovement = async (
  type: MovementType,
  input: MovementInput,
  session?: ClientSession
): Promise<{ quantity: number; reserved: number; available: number }> => {
  if (!MOVEMENT_TYPES.includes(type)) {
    throw new Error(`Unknown movement type: ${type}`);
  }

  const isAdjust = type === "adjust";
  if (isAdjust ? !Number.isFinite(input.quantity) : input.quantity <= 0) {
    throw new Error(
      isAdjust
        ? "adjust requires a signed quantity"
        : "Movement quantity must be greater than zero"
    );
  }

  const deltas = movementDeltasFor(type, input.quantity);

  // Guard + increment in one server-side operation — this is what stops two
  // concurrent movements overselling the last unit (§9).
  const updated = await Inventory.findOneAndUpdate(
    {
      product: input.product,
      warehouse: input.warehouse,
      ...guardFilter(type, input.quantity),
    },
    { $inc: { quantity: deltas.quantity, reserved: deltas.reserved } },
    { new: true, ...(session ? { session } : {}) }
  );

  if (!updated) {
    throw new InsufficientStockError(
      `Not enough stock for ${input.product} in warehouse ${input.warehouse}`
    );
  }

  assertInvariants(updated);

  // The audit row (§9's golden rule). Written in the same session so a movement
  // can never exist without its ledger entry.
  await StockMovement.create(
    [
      {
        product: input.product,
        warehouse: input.warehouse,
        type,
        quantity: Math.abs(input.quantity),
        // Stored so the row states its own direction instead of making a reader
        // hold the movement table in their head to interpret it.
        delta: deltas.quantity,
        reference: input.reference ?? "",
        user: input.user ?? null,
        note: input.note ?? "",
      },
    ],
    session ? { session } : undefined
  );

  return {
    quantity: updated.quantity,
    reserved: updated.reserved,
    available: available(updated),
  };
};

/**
 * Applies one movement across many lines.
 *
 * Multi-item orders must be all-or-nothing: holding three of four products and
 * failing on the fourth would reserve stock for an order that cannot be placed.
 * `withOptionalTransaction` supplies the session and the compensating fallback.
 */
const applyMovementAll = async (
  type: MovementType,
  items: MovementInput[],
  session?: ClientSession
) => {
  const results = [];
  for (const item of items) {
    results.push(await applyMovement(type, item, session));
  }
  return results;
};

/** Order placed: hold the units without moving them. */
export const reserve = (items: MovementInput[], session?: ClientSession) =>
  applyMovementAll("reserve", items, session);

/** Cancel / reservation expired: give the hold back. */
export const release = (items: MovementInput[], session?: ClientSession) =>
  applyMovementAll("release", items, session);

/**
 * Order fulfilled: units leave the building. Recorded as `out` — see
 * `MOVEMENT_TYPES` for why there is no separate `commit` movement.
 */
export const commit = (items: MovementInput[], session?: ClientSession) =>
  applyMovementAll("commit", items, session);

/** PO receive / restock. */
export const receive = (
  items: Omit<MovementInput, "warehouse">[],
  warehouse: mongoose.Types.ObjectId | string,
  reference?: string
) =>
  applyMovementAll(
    "in",
    items.map((item) => ({ ...item, warehouse, reference })),
    undefined
  );

/**
 * Manual correction. `delta` is signed and must be explained by `reason` — an
 * unexplained adjustment is indistinguishable from a bug.
 */
export const adjust = async (input: Omit<MovementInput, "quantity"> & {
  quantity: number;
  reason: string;
}) => {
  if (!input.reason?.trim()) {
    throw new Error("An adjustment needs a reason");
  }
  return applyMovement("adjust", { ...input, note: input.reason });
};

/**
 * Inter-warehouse move: leaves one ledger and arrives in the other.
 *
 * Two movement types rather than one signed quantity, because the audit row
 * stores a magnitude. The source leg is guarded on its floor, the destination
 * leg cannot overshoot, and each row says which side it is.
 */
export const transfer = async (
  fromWarehouse: mongoose.Types.ObjectId | string,
  toWarehouse: mongoose.Types.ObjectId | string,
  items: Omit<MovementInput, "warehouse">[]
) => {
  if (String(fromWarehouse) === String(toWarehouse)) {
    throw new Error("Source and destination warehouses must differ");
  }

  const moved = [];
  for (const item of items) {
    const units = Math.abs(item.quantity);
    if (!Number.isInteger(units) || units <= 0) {
      throw new Error("A transfer moves a positive whole number of units");
    }

    moved.push(
      await applyMovement("transfer_out", {
        ...item,
        warehouse: fromWarehouse,
        quantity: units,
      })
    );
    moved.push(
      await applyMovement("transfer_in", {
        ...item,
        warehouse: toWarehouse,
        quantity: units,
      })
    );
  }
  return moved;
};

/** What a customer can still buy for this product, across one or all warehouses. */
export const getAvailable = async (
  productId: mongoose.Types.ObjectId | string,
  warehouseId?: mongoose.Types.ObjectId | string
): Promise<number> => {
  const filter: Record<string, unknown> = { product: productId };
  if (warehouseId) filter.warehouse = warehouseId;

  const rows = await Inventory.find(filter)
    .select("quantity reserved")
    .lean();

  return rows.reduce(
    (sum, row) =>
      sum + available(row as unknown as { quantity: number; reserved: number }),
    0
  );
};

/** Products at or below their reorder level (§9's low-stock alert). */
export const getLowStock = async (
  warehouseId?: mongoose.Types.ObjectId | string
) => {
  const filter: Record<string, unknown> = {};
  if (warehouseId) filter.warehouse = warehouseId;

  return Inventory.aggregate([
    { $match: filter },
    { $addFields: { available: { $subtract: ["$quantity", "$reserved"] } } },
    { $match: { $expr: { $lte: ["$available", "$reorderLevel"] } } },
    { $sort: { available: 1 } },
  ]);
};

/** The warehouse a new product belongs in when no other is named. */
export const getDefaultWarehouse = async () => {
  const found = await Warehouse.findOne({ isDefault: true, isActive: true }).lean();
  if (!found) {
    throw new Error(
      "No default warehouse — run `npm run seed:warehouses` before using inventory"
    );
  }
  return found;
};
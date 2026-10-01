// services/inventoryService.ts
// ==========================================
// THE INVENTORY LEDGER (AGENT.md §9)
// ==========================================
// Every stock change goes through here and leaves a `StockMovement` row. Nothing
// in the codebase is allowed to `$inc` a product's stock without one.
//
//   reserve  order placed        holds units, quantity untouched
//   release  cancel / expired    gives the hold back
//   commit   order fulfilled     units leave the building
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
  type MovementType,
} from "../models/StockMovement.js";
import Warehouse from "../models/Warehouse.js";

/** Raised when a movement would drive stock below zero. */
export class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export interface StockDelta {
  quantity: number;
  reserved: number;
}

/**
 * Signed effect of a movement on `Inventory.quantity` / `.reserved`.
 *
 * `adjust` takes a signed delta; every other type takes a positive quantity and
 * derives its direction from the type (§9's table).
 */
export const movementDeltas = (
  type: MovementType,
  quantity: number
): StockDelta => {
  switch (type) {
    case "in":
    case "transfer":
      return { quantity, reserved: 0 };
    case "out":
      return { quantity: -quantity, reserved: 0 };
    case "reserve":
      return { quantity: 0, reserved: quantity };
    case "release":
      return { quantity: 0, reserved: -quantity };
    case "commit":
      return { quantity: -quantity, reserved: -quantity };
    case "adjust":
      return { quantity, reserved: 0 };
  }
};

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
    case "transfer":
      // Arriving stock cannot overshoot.
      return {};

    case "out":
    case "commit":
      return { quantity: { $gte: quantity } };

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
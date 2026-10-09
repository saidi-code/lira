// models/StockMovement.ts
// ==========================================
// The append-only audit trail. AGENT.md §9 golden rule:
// "never mutate stock directly — every change is a StockMovement".
//
// If this table and `Inventory` ever disagree, this table is the truth.
// ==========================================
import mongoose from "mongoose";

/**
 * Movement vocabulary.
 *
 * `transfer` is deliberately split into `_out` / `_in`. A single type could only
 * carry direction in the *sign* of `quantity`, but `quantity` is a magnitude
 * (below), so the direction was unrepresentable — and the sign the old code
 * passed was rejected by the schema's `min: 0` at runtime.
 *
 * `commit` is likewise separate from `out`: an `out` is a removal of stock that
 * was never held, whereas a `commit` fulfils a *hold*, so it must take the units
 * off the shelf **and** clear the reservation. Folding the two together left
 * every shipped order with a phantom reservation.
 */
export const MOVEMENT_TYPES = [
  "in", // PO receive, restock — units arrive
  "out", // direct removal — units leave, nothing was held for them
  "reserve", // order placed (unpaid) — holds units, quantity untouched
  "release", // cancel / reservation expired — gives the hold back
  "commit", // order fulfilled — the held units leave the shelf
  "transfer_out", // inter-warehouse, source side
  "transfer_in", // inter-warehouse, destination side
  "adjust", // manual correction, signed delta
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export interface StockDelta {
  quantity: number;
  reserved: number;
}

/**
 * Signed effect of a movement on `Inventory.quantity` / `.reserved`.
 *
 * Lives here, next to the vocabulary, because the audit row's `delta` is derived
 * from it and the schema below refuses to save a row where the two disagree.
 */
export const MOVEMENT_DELTAS: Record<
  MovementType,
  (quantity: number) => StockDelta
> = {
  in: (q) => ({ quantity: q, reserved: 0 }),
  out: (q) => ({ quantity: -q, reserved: 0 }),
  reserve: (q) => ({ quantity: 0, reserved: q }),
  release: (q) => ({ quantity: 0, reserved: -q }),
  // The hold is settled, not merely dropped: the units leave *and* the
  // reservation goes with them.
  commit: (q) => ({ quantity: -q, reserved: -q }),
  transfer_out: (q) => ({ quantity: -q, reserved: 0 }),
  transfer_in: (q) => ({ quantity: q, reserved: 0 }),
  // Manual corrections are the one signed case: the caller states the direction.
  adjust: (q) => ({ quantity: q, reserved: 0 }),
};

/** Applies the table above. */
export const movementDeltasFor = (
  type: MovementType,
  quantity: number
): StockDelta => MOVEMENT_DELTAS[type](quantity);

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    /** Sellable SKU; absent only on legacy product-level movements. */
    sku: { type: String, trim: true, default: null },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    type: { type: String, enum: MOVEMENT_TYPES, required: true },

    /**
     * The *magnitude* of the move, always positive. Human-readable at a glance.
     */
    quantity: { type: Number, required: true, min: 0 },

    /**
     * The signed effect on `Inventory.quantity`, derived from `type` above.
     *
     * Direction has to live in a real field: with direction only implied by
     * `type`, a plain `out` and a `commit` both read as "minus 3" on a summary,
     * and only someone holding the schema definition could tell them apart.
     * Storing it makes the row self-describing — `delta` alone already says
     * which way the shelf moved.
     */
    delta: { type: Number, required: true },

    /** Free-form pointer: an order number, a PO id, a transfer id. */
    reference: { type: String, default: "", trim: true },

    /** Who caused it — a Clerk user id for manual adjustments. */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    note: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A row that misstates its own effect is worse than no row: the audit trail is
// the fallback when `Inventory` is in doubt, so it is checked rather than trusted.
stockMovementSchema.pre("validate", function () {
  const type = this.type as MovementType;

  if (this.quantity < 0) {
    throw new Error(
      `A movement records a magnitude; ${this.quantity} belongs in \`delta\``
    );
  }

  // `adjust` is the one type whose direction the caller states, so only its
  // magnitude is derivable here.
  if (type === "adjust") {
    if (Math.abs(this.delta) !== this.quantity) {
      throw new Error(
        `An adjust of ${this.quantity} must change quantity by ±${this.quantity}, not ${this.delta}`
      );
    }
    return;
  }

  const expected = movementDeltasFor(type, this.quantity);
  if (this.delta !== expected.quantity) {
    throw new Error(
      `A ${type} of ${this.quantity} changes quantity by ${expected.quantity}, not ${this.delta}`
    );
  }
});

// AGENT.md §11 Key Indexes — "what moved for this product/warehouse lately?".
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ warehouse: 1, createdAt: -1 });
stockMovementSchema.index({ reference: 1 });

export const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;

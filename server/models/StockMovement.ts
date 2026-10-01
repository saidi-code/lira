// models/StockMovement.ts
// ==========================================
// The append-only audit trail. AGENT.md §9 golden rule:
// "never mutate stock directly — every change is a StockMovement".
//
// If this table and `Inventory` ever disagree, this table is the truth.
// ==========================================
import mongoose from "mongoose";

/** Movement vocabulary. Order of operations for a new type is in §9. */
export const MOVEMENT_TYPES = [
  "in", // PO receive, restock
  "out", // order fulfilled / direct removal
  "reserve", // order placed (unpaid) — holds units, quantity untouched
  "release", // cancel / reservation expired — gives the hold back
  "transfer", // inter-warehouse (one movement per side)
  "adjust", // manual correction, signed delta
] as const;

/**
 * `commit` is deliberately absent: fulfilment is an `out` movement. AGENT.md §9
 * lists `commit()` as a *service* call, not a movement — a hold is released by
 * taking the units out, and both facts belong in one ledger row.
 */

export type MovementType = (typeof MOVEMENT_TYPES)[number];

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    type: { type: String, enum: MOVEMENT_TYPES, required: true },

    /**
     * Always positive: the *direction* lives in `type` (see §9's table), so a
     * `-3` here would contradict the row it belongs to.
     */
    quantity: { type: Number, required: true, min: 0 },

    /** Free-form pointer: an order number, a PO id, a transfer id. */
    reference: { type: String, default: "", trim: true, index: true },

    /** Who caused it — a Clerk user id for manual adjustments. */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    note: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// AGENT.md §11 Key Indexes — "what moved for this product/warehouse lately?".
stockMovementSchema.index({ product: 1, createdAt: -1 });
stockMovementSchema.index({ warehouse: 1, createdAt: -1 });
stockMovementSchema.index({ reference: 1 });

export const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;
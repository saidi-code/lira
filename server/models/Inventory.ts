// models/Inventory.ts
// ==========================================
// Stock per product per warehouse. AGENT.md §11.
//
// This is the ledger the storefront trusts. `Product.stock` stays as a
// denormalised total for the catalogue, reconciled against these rows
// (jobs/reconcileStock, §9) — never written independently of a movement.
// ==========================================
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
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

    /** Physical units on the shelf. */
    quantity: { type: Number, required: true, default: 0, min: 0 },
    /** Units held for orders that have been placed but not yet fulfilled. */
    reserved: { type: Number, required: true, default: 0, min: 0 },

    /** Below this many *available* units the product is flagged low-stock (§9). */
    reorderLevel: { type: Number, default: 0, min: 0 },

    /** Where in the warehouse this product lives, e.g. "A3-14". */
    binLocation: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// AGENT.md §11 Key Indexes — one row per product per warehouse.
inventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
inventorySchema.index({ warehouse: 1, quantity: 1 });

// Invariant §11.4: reserved can never exceed what is on the shelf.
inventorySchema.pre("validate", function (next) {
  if (this.reserved > this.quantity) {
    return next(
      new Error(
        `Reserved (${this.reserved}) cannot exceed quantity (${this.quantity})`
      )
    );
  }
  return next();
});

export const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
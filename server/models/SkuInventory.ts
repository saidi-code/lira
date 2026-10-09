import mongoose from "mongoose";

/**
 * Additive SKU inventory ledger. The original product/warehouse `Inventory`
 * collection remains untouched for rollback and legacy audit purposes.
 */
const skuInventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sku: { type: String, required: true, trim: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    reserved: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    binLocation: { type: String, default: "", trim: true },
    migratedFromInventory: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

skuInventorySchema.index({ product: 1, sku: 1, warehouse: 1 }, { unique: true });
skuInventorySchema.index({ warehouse: 1, quantity: 1 });

skuInventorySchema.pre("validate", function () {
  if (this.reserved > this.quantity) {
    throw new Error(`Reserved (${this.reserved}) cannot exceed quantity (${this.quantity})`);
  }
});

export const SkuInventory = mongoose.model("SkuInventory", skuInventorySchema);
export default SkuInventory;

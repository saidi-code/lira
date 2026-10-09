import mongoose from "mongoose";
const variantSchema = new mongoose.Schema(
  {
    // A variant is one sellable color/size SKU. Existing records that stored a
    // one-element size array are normalized by the inventory migration.
    size: { type: String, trim: true, required: true },

    // SKU is required
    sku: { type: String, required: true },

    // Stock applies to the whole variant
    // Compatibility snapshot only. Inventory rows keyed by SKU are authoritative.
    stock: { type: Number, default: 0, min: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// No index here on purpose — see the note in Colors.ts. `variantSchema` is
// embedded in `colorSchema`, which is itself embedded in `Product`, so an index
// declared here landed on the Product collection too, and conflicted with the
// other one. Declare it on the standalone `Variant` model if it is ever needed.

// Kept for standalone use, and exported so other schemas can embed it.
const Variant = mongoose.model("Variant", variantSchema);

variantSchema.methods.generateSKU = function (productName: string, colorName: string) {
  const namePart = productName.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const colorPart = colorName.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const sizePart = this.size.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.sku = `${namePart}-${colorPart}-${sizePart}-${randomPart}`;
} 
export { variantSchema }
export default Variant

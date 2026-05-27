import mongoose from "mongoose";
const variantSchema = new mongoose.Schema(
  {
    // Allow a variant to hold many sizes
    sizes: [{ type: String, required: true }],

    // SKU is required
    sku: { type: String, required: true },

    // Stock applies to the whole variant
    stock: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

variantSchema.index({sku:'text'})

// Keep the model for standalone usage, but export the schema too so other schemas can embed it.
const Variant = mongoose.model("Variant",variantSchema)

variantSchema.methods.generateSKU = function (productName: string, colorName: string) {
  const namePart = productName.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const colorPart = colorName.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const sizePart = this.size.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.sku = `${namePart}-${colorPart}-${sizePart}-${randomPart}`;
} 
export { variantSchema }
export default Variant

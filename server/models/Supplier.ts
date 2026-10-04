// models/Supplier.ts
// ==========================================
// Who the goods come from. AGENT.md §11.
// ==========================================
import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    /** Named contact person — who a warehouse manager rings. */
    contact: { type: String, default: "", trim: true, maxlength: 200 },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      maxlength: 200,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: { type: String, default: "", trim: true, maxlength: 40 },

    address: {
      street: { type: String, default: "", maxlength: 300 },
      city: { type: String, default: "", maxlength: 100 },
      state: { type: String, default: "", maxlength: 100 },
      zipCode: { type: String, default: "", maxlength: 20 },
      country: { type: String, default: "", maxlength: 100 },
    },

    /**
     * Products this supplier provides. Advisory only — nothing enforces that a
     * purchase order's items come from this list, because in practice a supplier
     * suddenly starts shipping something they were never listed for.
     */
    products: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ name: 1 });
supplierSchema.index({ isActive: 1, name: 1 });

export const Supplier = mongoose.model("Supplier", supplierSchema);
export default Supplier;
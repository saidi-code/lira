// models/Supplier.ts
// ==========================================
// Who the goods come from. AGENT.md §11.
// ==========================================
import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Named contact person — who a warehouse manager rings. */
    contact: { type: String, default: "", trim: true },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: { type: String, default: "", trim: true },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
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
// models/Warehouse.ts
// ==========================================
// A physical location stock can sit in. AGENT.md §11.
// ==========================================
import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    /** Short human code, e.g. "MAIN". Unique — it is how POs and labels refer to it. */
    code: { type: String, required: true, trim: true, uppercase: true },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" },
    },

    isActive: { type: Boolean, default: true },

    /**
     * The warehouse checkout draws from and every product is seeded into first.
     * `pre('validate')` keeps exactly one active default at all times.
     */
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// AGENT.md §11 Key Indexes: short code is looked up on every PO and label.
warehouseSchema.index({ code: 1 }, { unique: true });
warehouseSchema.index({ isActive: 1, isDefault: -1 });

// Promise-style hook: mongoose 9 does not accept an `async` hook that also takes
// `next`, and a rejection here surfaces as a normal validation error.
warehouseSchema.pre("validate", async function () {
  if (!this.isDefault || !this.isActive) return;

  const others = await mongoose.model("Warehouse").find({
    _id: { $ne: this._id },
    isDefault: true,
    isActive: true,
  });

  if (others.length > 0) {
    throw new Error(
      "A default warehouse already exists — demote it first (POST /warehouses/:id/default)"
    );
  }
});

export const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export default Warehouse;
// models/Transfer.ts
// ==========================================
// Moving stock between warehouses. AGENT.md §11.
//
// The ledger is the record of what moved; this document is the *intent* and its
// progress. `inventoryService.transfer` writes both legs atomically when a
// transaction is available, so a completed transfer can never be half-applied.
// ==========================================
import mongoose from "mongoose";

export const TRANSFER_STATUSES = [
  "draft", // created, nothing moved
  "in_transit", // left the source, not yet booked in
  "completed", // arrived and booked in — terminal
  "cancelled", // called off before dispatch — terminal
] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

const transferItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true }, // snapshot
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, trim: true, uppercase: true },

    fromWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    toWarehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },

    status: {
      type: String,
      enum: TRANSFER_STATUSES,
      default: "draft",
      index: true,
    },

    items: {
      type: [transferItemSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length > 0,
        message: "A transfer needs at least one line",
      },
    },

    notes: { type: String, default: "", maxlength: 500 },

    /** Who raised it. */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

transferSchema.index({ fromWarehouse: 1, status: 1 });
transferSchema.index({ toWarehouse: 1, status: 1 });
transferSchema.index({ createdAt: -1 });

// Promise-style hook (mongoose 9 rejects `async` + `next`).
transferSchema.pre("validate", function () {
  if (String(this.fromWarehouse) === String(this.toWarehouse)) {
    throw new Error("Source and destination warehouses must differ");
  }
});

export const Transfer = mongoose.model("Transfer", transferSchema);
export default Transfer;
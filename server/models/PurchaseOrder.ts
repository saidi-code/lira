// models/PurchaseOrder.ts
// ==========================================
// An order placed with a supplier. AGENT.md §11.
//
// Totals are snapshots of what was agreed, not a source of truth for the ledger:
// receiving is what actually moves stock (see services/purchaseOrderService).
// ==========================================
import mongoose from "mongoose";

export const PO_STATUSES = [
  "draft", // editable, nothing ordered yet
  "ordered", // sent to the supplier, nothing received
  "partially_received", // some units in
  "received", // fully in — terminal
  "cancelled", // called off — terminal
] as const;

export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

// ---- Line item (embedded) ----
const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true }, // snapshot, like Order.items
    /** Units ordered. */
    quantity: { type: Number, required: true, min: 1 },
    /** Units received so far. Invariant §11.5: never exceeds `quantity`. */
    receivedQty: { type: Number, default: 0, min: 0 },
    /** Agreed unit price, in the shop's currency (TND). */
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Promise-style hook (mongoose 9 rejects `async` + `next`).
purchaseOrderItemSchema.pre("validate", function () {
  if (this.receivedQty > this.quantity) {
    throw new Error(
      `Received (${this.receivedQty}) cannot exceed ordered (${this.quantity})`
    );
  }
});

// ---- Purchase order ----
const purchaseOrderSchema = new mongoose.Schema(
  {
    /** Human reference, e.g. "PO-20260110-K3F". Unique. */
    orderNumber: { type: String, unique: true, index: true },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    status: {
      type: String,
      enum: PO_STATUSES,
      default: "draft",
      index: true,
    },

    items: {
      type: [purchaseOrderItemSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length > 0,
        message: "A purchase order needs at least one line",
      },
    },

    /** Snapshots, recomputed on every save so they cannot drift from `items`. */
    subtotal: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    /** When the goods are promised. */
    expectedAt: { type: Date, default: null },
    /** Set when the order reaches `received`. */
    receivedAt: { type: Date, default: null },

    notes: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ supplier: 1, status: 1 });
purchaseOrderSchema.index({ createdAt: -1 });

/** Keeps the money snapshots in step with the lines. */
purchaseOrderSchema.pre("save", function () {
  this.subtotal = this.items.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  );
  this.total = this.subtotal + (this.shipping ?? 0);
});

export const PurchaseOrder = mongoose.model(
  "PurchaseOrder",
  purchaseOrderSchema
);
export default PurchaseOrder;
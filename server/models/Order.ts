// models/orderModel.js
import mongoose from "mongoose";

// ==========================================
// 1. Order Item Sub-Schema
// ==========================================
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    sku: { type: String, trim: true, default: null },
    name: { type: String, required: true },        // snapshot of product name
    image: { type: String },                        // snapshot of product image
    price: { type: Number, required: true },        // snapshot of price at purchase
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: null },
    color: { type: String, default: null },
    subtotal: { type: Number, required: true },     // price * quantity
  },
  { _id: false } // no separate _id for subdocs (optional; remove if you want it)
);

// ==========================================
// 2. Shipping Address Sub-Schema (embedded snapshot)
// ==========================================
const shippingAddressSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Home", "Work", "Other"], default: "Other" },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phoneNumber: { type: String, required: true },
  },
  { _id: false }
);

// ==========================================
// 3. Order Number Generator
// ==========================================
/**
 * Generates a unique order number like:
 *   ORD-20250921-8F3K9A
 *   ORD-<YYYYMMDD>-<6 random alphanumeric chars>
 */
const generateOrderNumber = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}${String(now.getDate()).padStart(2, "0")}`;

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `ORD-${datePart}-${randomPart}`;
};

// ==========================================
// 4. Main Order Schema
// ==========================================
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },

    /**
     * Replay guard for POST /orders. The client sends an `Idempotency-Key`
     * header per checkout attempt; a retried submit (double tap, flaky network)
     * then resolves to the *same* order instead of charging/deducting twice.
     */
    idempotencyKey: {
      type: String,
      default: undefined,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr: unknown[]) => Array.isArray(arr) && arr.length > 0,
        message: "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "stripe"],
      default: "cash",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    paymentIntentId: { type: String },

    /**
     * The warehouse this order's units were reserved from, stamped at checkout.
     *
     * Cancellation and fulfilment must release the hold from the same row it was
     * taken in. Re-resolving "whatever is the default warehouse today" would send
     * a year-old order's units back to a warehouse that never held them — the
     * phantom reservation would then sit in the wrong row forever.
     */
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },

    orderStatus: {
      type: String,
      enum: ["placed", "processing", "shipped", "delivered", "cancelled"],
      default: "placed",
    },

    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    notes: { type: String, maxlength: 500 },

    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

// ==========================================
// 5. Pre-save Hook — Auto-generate orderNumber
// ==========================================
orderSchema.pre("save", async function () {
  // Only generate if this is a new document and orderNumber is not set
  if (!this.isNew || this.orderNumber) return;

  const Order = mongoose.model("Order");

  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  while (attempts < MAX_ATTEMPTS) {
    const candidate = generateOrderNumber();
    const exists = await Order.exists({ orderNumber: candidate });

    if (!exists) {
      this.orderNumber = candidate;
      return;
    }
    attempts++;
  }

  // Extremely unlikely fallback: timestamp-based unique suffix
  this.orderNumber = `ORD-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
});

// ==========================================
// 6. Virtuals (optional but useful)
// ==========================================
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// ==========================================
// 7. Indexes (for fast queries)
// ==========================================
orderSchema.index({ user: 1, createdAt: -1 }); // user's orders sorted by date
orderSchema.index({ orderStatus: 1 });
// Only one order may claim a given idempotency key *per customer*. Scoping it to
// `user` keeps the guard exactly as strong (the controller always looks the key up
// by `user` + key too) while stopping one customer's key from colliding with, or
// resolving to, another customer's order. `partialFilterExpression` keeps the
// constraint off the (many) orders that have no key at all.
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  }
);

// ==========================================
// 8. Export
// ==========================================
export default mongoose.model("Order", orderSchema);

// services/orderLifecycleService.ts
// ==========================================
// ORDER → PAYMENT LIFECYCLE
// ==========================================
// Two transitions the order domain was missing:
//
//   1. `pending` → `paid`  (something confirmed the money arrived)
//   2. `pending` → released (the window expired; cancel + return the stock)
//
// Both are guarded single-statement updates rather than read-then-write, for the
// same reason `cancelAndRestock` is: two callers racing must not both win.
//
// The stores are injected so the rules below are unit-testable without MongoDB
// (tests/orderLifecycle.test.ts) — same pattern as `CancellationStore`.
// ==========================================
import mongoose from "mongoose";
import Order from "../models/Order.js";
import { cancelAndRestock, type CancellableOrder } from "../controllers/OrderController.js";
import {
  AWAITING_ONLINE_PAYMENT_METHODS,
  isPaymentSweepEnabled,
  paymentExpiryCutoff,
} from "../config/orders.js";

/** An order as the expiry sweep sees it. */
export interface ExpirableOrder extends CancellableOrder {
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: Date;
}

/**
 * Pure rule: would this order's stock be released if the window had passed?
 *
 * The *time* test is deliberately not here — it belongs in the query, where the
 * `{ user: 1, createdAt: -1 }` index can serve it instead of scanning every order
 * into memory. This function answers only the state question:
 *
 *   - an order that is already paid, shipped or cancelled holds nothing to release
 *   - COD is settled on delivery, so it is a real order, not an abandoned checkout
 */
export const isExpirable = (order: {
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
}): boolean =>
  order.paymentStatus === "pending" &&
  AWAITING_ONLINE_PAYMENT_METHODS.includes(order.paymentMethod) &&
  order.orderStatus !== "shipped" &&
  order.orderStatus !== "delivered" &&
  order.orderStatus !== "cancelled";

export interface ExpiryStore {
  /** Unpaid online orders older than `cutoff`, oldest first. */
  findExpired(cutoff: Date, limit: number): Promise<ExpirableOrder[]>;
  /** Cancel one and return its stock. Resolves `false` if it was not cancellable. */
  cancel(order: ExpirableOrder): Promise<boolean>;
}

export interface ExpiryResult {
  scanned: number;
  released: number;
  /** Raced with a payment, or somebody cancelled it first. */
  skipped: number;
}

/**
 * Releases the stock of every unpaid order past its window.
 *
 * Safe to run repeatedly and safe to run concurrently: `cancel` is the guarded
 * claim from the cancel path, so a sweep that overlaps with a payment (or with
 * another sweep) releases nothing twice — the loser just reports `skipped`.
 */
export const releaseExpiredOrders = async (
  store: ExpiryStore,
  options: { now?: Date; limit?: number } = {}
): Promise<ExpiryResult> => {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 100;

  if (!isPaymentSweepEnabled()) {
    return { scanned: 0, released: 0, skipped: 0 };
  }

  const expired = await store.findExpired(paymentExpiryCutoff(now), limit);

  const result: ExpiryResult = { scanned: expired.length, released: 0, skipped: 0 };

  for (const order of expired) {
    // Re-checked here because the document was read moments ago: a webhook may
    // have settled it in between, and paying a released order is a real bug.
    if (!isExpirable(order)) {
      result.skipped++;
      continue;
    }

    const cancelled = await store.cancel(order);
    if (cancelled) result.released++;
    else result.skipped++;
  }

  return result;
};

/** The real store: mongoose, against MongoDB. */
export const expiryStore: ExpiryStore = {
  findExpired: async (cutoff, limit) => {
    const orders = await Order.find({
      paymentStatus: "pending",
      paymentMethod: { $in: AWAITING_ONLINE_PAYMENT_METHODS },
      orderStatus: { $in: ["placed", "processing"] },
      createdAt: { $lt: cutoff },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return orders as unknown as ExpirableOrder[];
  },

  cancel: (order) => cancelAndRestock(order),
};

// ==========================================
// PAYMENT CONFIRMATION
// ==========================================
/** Pure rule: may this order still move to `paid`? */
export const canBePaid = (order: {
  paymentStatus: string;
  orderStatus: string;
}): boolean =>
  order.paymentStatus === "pending" && order.orderStatus !== "cancelled";

export type MarkPaidResult =
  | { ok: true; order: Record<string, unknown> }
  | { ok: false; reason: "invalid" | "not_found" | "not_payable" };

/**
 * Confirms payment for an order: `pending` → `paid`, once.
 *
 * The `paymentStatus: "pending"` predicate is the guard, so:
 *   - a webhook delivered twice marks the order paid once and the second call
 *     reports `not_payable` instead of restarting the fulfilment side effects;
 *   - a refused/refunded order is never silently re-marked as paid;
 *   - an order that was already released for non-payment cannot be paid — the
 *     units went back on the shelf, so the money must be refunded instead.
 */
export const markOrderPaid = async (
  orderId: string,
  options: { paymentIntentId?: string } = {}
): Promise<MarkPaidResult> => {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { ok: false, reason: "invalid" };
  }

  // Read first so "no such order" can be told apart from "already settled";
  // the guarded update below is still what makes the transition race-safe.
  const existing = await Order.findById(orderId)
    .select("paymentStatus orderStatus")
    .lean();

  if (!existing) return { ok: false, reason: "not_found" };
  if (!canBePaid(existing)) return { ok: false, reason: "not_payable" };

  const extra = options.paymentIntentId
    ? { paymentIntentId: options.paymentIntentId }
    : {};

  const updated = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: "pending", orderStatus: { $ne: "cancelled" } },
    { $set: { paymentStatus: "paid", ...extra } },
    { new: true }
  ).lean();

  // Lost the race to another confirmation (or to the expiry sweep).
  if (!updated) return { ok: false, reason: "not_payable" };

  return { ok: true, order: updated as Record<string, unknown> };
};
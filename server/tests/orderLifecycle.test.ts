// tests/orderLifecycle.test.ts
// ==========================================
// An abandoned online checkout used to reserve its stock forever: the units left
// the storefront and nothing ever put them back. The sweep fixes that, and the
// cost of getting it wrong is symmetrical — release a paid order and a customer
// is told their purchase is cancelled; release nothing and stock rots.
//
// Every rule below is exercised with an injected store, so the cases that matter
// (COD must not expire, a paid order must not be released, a sweep that overlaps
// with a payment) run without MongoDB — the same pattern as tests/cancel.test.ts.
//
//   npm test
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";

import {
  canBePaid,
  isExpirable,
  releaseExpiredOrders,
  type ExpirableOrder,
  type ExpiryStore,
} from "../services/orderLifecycleService.js";
import {
  AWAITING_ONLINE_PAYMENT_METHODS,
  ORDER_CONFIG,
} from "../config/orders.js";

// config/orders.ts reads env at import time; the default window (60) is what the
// assertions below assume.
const order = (overrides: Partial<ExpirableOrder> = {}): ExpirableOrder => ({
  _id: new mongoose.Types.ObjectId(),
  orderStatus: "placed",
  paymentMethod: "stripe",
  paymentStatus: "pending",
  items: [
    { product: new mongoose.Types.ObjectId(), name: "Oud Wood 50ml", quantity: 2 },
  ],
  ...overrides,
});

describe("isExpirable", () => {
  it("accepts an unpaid online order that still holds stock", () => {
    assert.equal(isExpirable(order()), true);
    assert.equal(isExpirable(order({ orderStatus: "processing" })), true);
  });

  it("never expires a COD order", () => {
    // `cash` is settled on delivery, so it is a real order holding stock — not an
    // abandoned checkout. Releasing it would cancel a customer's purchase.
    assert.equal(isExpirable(order({ paymentMethod: "cash" })), false);
  });

  it("leaves settled, shipped and cancelled orders alone", () => {
    assert.equal(isExpirable(order({ paymentStatus: "paid" })), false);
    assert.equal(isExpirable(order({ paymentStatus: "refunded" })), false);
    assert.equal(isExpirable(order({ orderStatus: "shipped" })), false);
    assert.equal(isExpirable(order({ orderStatus: "delivered" })), false);
    assert.equal(isExpirable(order({ orderStatus: "cancelled" })), false);
  });
});

describe("canBePaid", () => {
  it("allows a pending, live order", () => {
    assert.equal(canBePaid({ paymentStatus: "pending", orderStatus: "placed" }), true);
  });

  it("refuses an order that is already settled", () => {
    // A webhook delivered twice must not re-run fulfilment side effects.
    assert.equal(canBePaid({ paymentStatus: "paid", orderStatus: "placed" }), false);
    assert.equal(canBePaid({ paymentStatus: "refunded", orderStatus: "placed" }), false);
  });

  it("refuses a cancelled order", () => {
    // Its stock is already back on the shelf, so money must be refunded, not
    // booked against a live order.
    assert.equal(canBePaid({ paymentStatus: "pending", orderStatus: "cancelled" }), false);
  });
});

describe("releaseExpiredOrders", () => {
  const storeOf = (
    expired: ExpirableOrder[],
    cancel: ExpiryStore["cancel"]
  ): { store: ExpiryStore; cancelled: ExpirableOrder[] } => {
    const cancelled: ExpirableOrder[] = [];
    return {
      cancelled,
      store: {
        findExpired: async () => expired,
        cancel: async (o) => {
          cancelled.push(o);
          return cancel(o);
        },
      },
    };
  };

  it("releases every expired order it is handed", async () => {
    const a = order();
    const b = order();
    const { store, cancelled } = storeOf([a, b], async () => true);

    const result = await releaseExpiredOrders(store);

    assert.deepEqual(result, { scanned: 2, released: 2, skipped: 0 });
    assert.deepEqual(cancelled, [a, b]);
  });

  it("re-checks each order before touching it", async () => {
    // The row was read moments ago; a webhook may have settled it since. Paying a
    // released order is the worst outcome, so a stale row must not be cancelled.
    const stale = order({ paymentStatus: "paid" });
    const { store, cancelled } = storeOf([stale], async () => true);

    const result = await releaseExpiredOrders(store);

    assert.deepEqual(result, { scanned: 1, released: 0, skipped: 1 });
    assert.deepEqual(cancelled, []);
  });

  it("counts a lost race as skipped, not released", async () => {
    // `cancel` is the guarded claim, so it reports false when somebody else got
    // there first. Counting that as a release would overstate what happened.
    const { store } = storeOf([order()], async () => false);

    const result = await releaseExpiredOrders(store);

    assert.deepEqual(result, { scanned: 1, released: 0, skipped: 1 });
  });

  it("keeps going when one order cannot be released", async () => {
    const first = order();
    const second = order();
    const { store, cancelled } = storeOf([first, second], async (o) =>
      String(o._id) !== String(first._id)
    );

    const result = await releaseExpiredOrders(store);

    assert.deepEqual(result, { scanned: 2, released: 1, skipped: 1 });
    assert.equal(cancelled.length, 2);
  });

  it("is enabled by default", () => {
    // Every other test here assumes the sweep actually runs. A default window of
    // 0 would silently turn the whole feature off, so pin the expectation.
    assert.ok(
      ORDER_CONFIG.paymentWindowMinutes > 0,
      "PAYMENT_WINDOW_MINUTES must default to a real window"
    );
    assert.ok(
      AWAITING_ONLINE_PAYMENT_METHODS.includes("stripe"),
      "online payment methods must be swept"
    );
    assert.ok(
      !AWAITING_ONLINE_PAYMENT_METHODS.includes("cash"),
      "COD must never be released for non-payment"
    );
  });
});
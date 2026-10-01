// tests/purchasing.test.ts
// ==========================================
// Purchasing rules, tested without a database.
//
// The dangerous bug here is over-receiving: a purchase order says 50, a clerk
// books 60, and 10 units exist that nobody ordered, cannot be accounted for and
// eventually get sold. The guards below are small functions whose only job is to
// make that impossible.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose from "mongoose";

import {
  acceptsReceipt,
  applyReceipt,
  canCancelPurchaseOrder,
  purchaseOrderNumber,
  ReceiveError,
  receiptGuard,
  remaining,
  statusAfterReceipt,
  type ReceivableLine,
} from "../services/purchaseOrderService.js";
import {
  canCancel as canCancelTransfer,
  transitionFor as transferTransition,
} from "../services/transferService.js";

const line = (over: Partial<ReceivableLine> = {}): ReceivableLine => ({
  product: new mongoose.Types.ObjectId(),
  name: "Oud Wood 50ml",
  quantity: 10,
  receivedQty: 0,
  ...over,
});

describe("remaining", () => {
  it("is what the order still owes", () => {
    assert.equal(remaining(line()), 10);
    assert.equal(remaining(line({ receivedQty: 4 })), 6);
    assert.equal(remaining(line({ receivedQty: 10 })), 0);
  });
});

describe("applyReceipt — the over-receive guard", () => {
  it("accepts a receipt within what is outstanding", () => {
    assert.equal(applyReceipt(line(), 4), 4);
    assert.equal(applyReceipt(line({ receivedQty: 6 }), 4), 10);
  });

  it("refuses to receive more than was ordered", () => {
    assert.throws(() => applyReceipt(line({ quantity: 10, receivedQty: 4 }), 7), ReceiveError);
  });

  it("refuses to receive onto an already-complete line", () => {
    assert.throws(
      () => applyReceipt(line({ quantity: 10, receivedQty: 10 }), 1),
      ReceiveError
    );
  });

  it("refuses nonsense quantities", () => {
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      assert.throws(() => applyReceipt(line(), bad), ReceiveError);
    }
  });

  it("explains how much is actually left", () => {
    assert.throws(
      () => applyReceipt(line({ name: "Candle", quantity: 10, receivedQty: 7 }), 5),
      /only 3 outstanding/
    );
  });
});

describe("receiptGuard — concurrency", () => {
  it("carries the ceiling into the update", () => {
    // `receivedQty <= quantity - n` must travel with the write, otherwise two
    // clerks receiving the last units both succeed.
    const target = new mongoose.Types.ObjectId();
    const guard = receiptGuard(
      { product: target, name: "Oud", quantity: 10, receivedQty: 6 },
      4
    );

    assert.deepEqual(guard, {
      items: {
        $elemMatch: {
          product: target,
          receivedQty: { $lte: 6 },
        },
      },
    });
  });

  it("closes the door once the line is exhausted", () => {
    // Nothing outstanding ⇒ the ceiling is below one unit, so any receipt fails.
    const guard = receiptGuard(
      { product: new mongoose.Types.ObjectId(), name: "Oud", quantity: 10, receivedQty: 10 },
      1
    );
    assert.deepEqual(
      (guard.items as { $elemMatch: { receivedQty: { $lte: number } } }).$elemMatch
        .receivedQty,
      { $lte: 9 }
    );
  });
});

describe("statusAfterReceipt", () => {
  it("is partial until every line is complete", () => {
    assert.equal(
      statusAfterReceipt("ordered", [
        line({ quantity: 10, receivedQty: 10 }),
        line({ quantity: 5, receivedQty: 2 }),
      ]),
      "partially_received"
    );
  });

  it("is received when everything has arrived", () => {
    assert.equal(
      statusAfterReceipt("partially_received", [
        line({ quantity: 10, receivedQty: 10 }),
      ]),
      "received"
    );
  });

  it("does not leave a draft looking unsent once goods arrive", () => {
    // Goods on the shelf means the order was sent, whatever the doc still says.
    assert.equal(
      statusAfterReceipt("draft", [line({ quantity: 10, receivedQty: 10 })]),
      "received"
    );
  });
});

describe("acceptsReceipt", () => {
  it("refuses terminal states", () => {
    assert.equal(acceptsReceipt("received"), false);
    assert.equal(acceptsReceipt("cancelled"), false);
    assert.equal(acceptsReceipt("draft"), true);
    assert.equal(acceptsReceipt("ordered"), true);
    assert.equal(acceptsReceipt("partially_received"), true);
  });
});

describe("canCancelPurchaseOrder", () => {
  it("allows cancelling before anything arrives", () => {
    assert.equal(canCancelPurchaseOrder("ordered", [line()]), true);
  });

  it("refuses once units are on the shelf", () => {
    // They would have to be shipped back; that is not a cancellation.
    assert.equal(
      canCancelPurchaseOrder("partially_received", [line({ receivedQty: 2 })]),
      false
    );
  });

  it("refuses terminal states", () => {
    assert.equal(canCancelPurchaseOrder("received", [line({ receivedQty: 10 })]), false);
    assert.equal(canCancelPurchaseOrder("cancelled", [line()]), false);
  });
});

describe("purchaseOrderNumber", () => {
  it("is prefixed, dated and random", () => {
    const ref = purchaseOrderNumber(new Date(2026, 0, 10));
    assert.match(ref, /^PO-20260110-[A-Z0-9]{4}$/);
  });

  it("does not repeat itself", () => {
    const refs = new Set(Array.from({ length: 50 }, () => purchaseOrderNumber()));
    assert.equal(refs.size, 50);
  });
});

describe("transfer transitions", () => {
  it("moves stock only on completion", () => {
    assert.equal(transferTransition("draft", "completed"), "move");
    assert.equal(transferTransition("in_transit", "completed"), "move");
    assert.equal(transferTransition("draft", "in_transit"), "none");
    assert.equal(transferTransition("draft", "cancelled"), "none");
  });

  it("never moves stock twice", () => {
    assert.equal(transferTransition("completed", "completed"), "none");
    assert.equal(transferTransition("completed", "in_transit"), "forbidden");
    assert.equal(transferTransition("cancelled", "completed"), "forbidden");
  });

  it("allows cancelling only before completion", () => {
    assert.equal(canCancelTransfer("draft"), true);
    assert.equal(canCancelTransfer("in_transit"), true);
    assert.equal(canCancelTransfer("completed"), false);
    assert.equal(canCancelTransfer("cancelled"), false);
  });
});
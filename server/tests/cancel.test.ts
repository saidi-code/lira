// tests/cancel.test.ts
// ==========================================
// Cancelling is the place where a bug quietly destroys inventory: if the status
// flips but the units are not returned, those products disappear from the
// storefront with no record. The claim → restock pair is the whole risk, and the
// interesting cases (a cancel that raced with another, a restore that fails
// halfway, a deployment without transactions) are exactly the ones a live MongoDB
// makes slow to provoke — so the store is injected and faked here.
//
// Node's built-in test runner, same as tests/pricing.test.ts.
//
//   npm test
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import mongoose, { type ClientSession } from "mongoose";

import {
  runCancellation,
  type CancellableOrder,
  type CancellationStore,
} from "../controllers/OrderController.js";

type StockLine = {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
};

const orderId = new mongoose.Types.ObjectId();
const session = {} as ClientSession;

const placedOrder = (
  overrides: Partial<CancellableOrder> = {}
): CancellableOrder => ({
  _id: orderId,
  orderStatus: "placed",
  items: [
    { product: new mongoose.Types.ObjectId(), name: "Oud Wood 50ml", quantity: 2 },
    { product: new mongoose.Types.ObjectId(), name: "Soy Candle 200g", quantity: 1 },
  ],
  ...overrides,
});

/** A store that records everything `runCancellation` asks of it. */
const fakeStore = (overrides: Partial<CancellationStore> = {}) => {
  const calls = {
    claimed: [] as {
      orderId: string;
      extraSet: Record<string, string>;
      session?: ClientSession;
    }[],
    restored: [] as { lines: StockLine[]; session?: ClientSession }[],
    reverted: [] as { orderId: string; previousStatus: string }[],
  };

  const store: CancellationStore = {
    claimCancellation: async (order, extraSet, atSession) => {
      calls.claimed.push({ orderId: String(order._id), extraSet, session: atSession });
      return { orderStatus: order.orderStatus };
    },
    restoreStock: async (lines, atSession) => {
      calls.restored.push({ lines, session: atSession });
    },
    revertCancellation: async (id, previousStatus) => {
      calls.reverted.push({ orderId: String(id), previousStatus });
    },
    ...overrides,
  };

  return { store, calls };
};

describe("runCancellation", () => {
  it("restores every line of the order, exactly once", async () => {
    const order = placedOrder();
    const { store, calls } = fakeStore();

    const cancelled = await runCancellation(order, store);

    assert.equal(cancelled, true);
    assert.equal(calls.restored.length, 1);
    assert.deepEqual(
      calls.restored[0].lines.map((line) => [String(line.product), line.quantity]),
      order.items.map((item) => [String(item.product), item.quantity])
    );
  });

  it("touches no stock when the order no longer holds it", async () => {
    // The real store returns null here: the `{ orderStatus: { $in: STOCK_HELD } }`
    // filter did not match, because somebody already cancelled the order or it
    // has shipped. Restocking anyway would hand out free units.
    const { store, calls } = fakeStore({ claimCancellation: async () => null });

    const cancelled = await runCancellation(placedOrder(), store);

    assert.equal(cancelled, false);
    assert.deepEqual(calls.restored, []);
    assert.deepEqual(calls.reverted, []);
  });

  it("carries the caller's extra writes into the same claim", async () => {
    // Admin status updates set paymentStatus (e.g. "refunded") in the same moment
    // as the status, so an order can never be cancelled without its money state.
    const { store, calls } = fakeStore();

    await runCancellation(placedOrder(), store, { paymentStatus: "refunded" });

    assert.deepEqual(calls.claimed[0].extraSet, { paymentStatus: "refunded" });
  });

  it("threads the transaction session through both writes", async () => {
    const { store, calls } = fakeStore();

    await runCancellation(placedOrder(), store, {}, session);

    assert.equal(calls.claimed[0].session, session);
    assert.equal(calls.restored[0].session, session);
  });

  it("puts the original status back when a restore fails with no transaction", async () => {
    // Standalone MongoDB: there is no rollback, so a half-done cancel has to undo
    // itself or the order sits at "cancelled" with its units still gone.
    const failure = new Error("MongoServerSelectionError");
    const { store, calls } = fakeStore({
      restoreStock: async () => {
        throw failure;
      },
    });

    await assert.rejects(
      () => runCancellation(placedOrder({ orderStatus: "processing" }), store),
      (error: unknown) => error === failure
    );

    assert.deepEqual(calls.reverted, [
      { orderId: String(orderId), previousStatus: "processing" },
    ]);
  });

  it("leaves the rollback to the transaction when there is one", async () => {
    const { store, calls } = fakeStore({
      restoreStock: async () => {
        throw new Error("write conflict");
      },
    });

    await assert.rejects(() => runCancellation(placedOrder(), store, {}, session));

    // A manual revert here would fight the abort and could double-restore later.
    assert.deepEqual(calls.reverted, []);
  });

  it("reverts to the status the database really had, not the caller's copy", async () => {
    // The claim reports the status read back from MongoDB, so a stale `placed`
    // held by the caller cannot resurrect an order that had moved on.
    const { store, calls } = fakeStore({
      claimCancellation: async () => ({ orderStatus: "processing" }),
      restoreStock: async () => {
        throw new Error("boom");
      },
    });

    await assert.rejects(() => runCancellation(placedOrder(), store));

    assert.equal(calls.reverted[0].previousStatus, "processing");
  });

  it("still reports the stock failure when the rollback also fails", async () => {
    const failure = new Error("restore failed");
    const { store } = fakeStore({
      restoreStock: async () => {
        throw failure;
      },
      revertCancellation: async () => {
        throw new Error("database is down");
      },
    });

    await assert.rejects(
      () => runCancellation(placedOrder(), store),
      (error: unknown) => error === failure
    );
  });
});

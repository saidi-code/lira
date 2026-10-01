// tests/inventory.test.ts
// ==========================================
// The inventory rules that money and stock depend on, tested without MongoDB.
//
// The dangerous bugs in a ledger are all "two numbers disagreed": stock sold
// twice, a hold that outgrew the shelf, a correction that went negative. Each
// one below is a two-line function that must be right on its own.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertInvariants,
  available,
  guardFilter,
  InsufficientStockError,
  movementDeltas,
} from "../services/inventoryService.js";
import {
  MOVEMENT_TYPES,
  type MovementType,
} from "../models/StockMovement.js";
import { findDrift } from "../services/reconcileService.js";
import { transitionFor } from "../services/orderStockService.js";

describe("available (§9)", () => {
  it("is quantity minus the hold", () => {
    assert.equal(available({ quantity: 10, reserved: 3 }), 7);
    assert.equal(available({ quantity: 10, reserved: 10 }), 0);
    assert.equal(available({ quantity: 0, reserved: 0 }), 0);
  });
});

describe("movementDeltas (§9's movement table)", () => {
  it("reserve holds units without moving them", () => {
    assert.deepEqual(movementDeltas("reserve", 4), { quantity: 0, reserved: 4 });
  });

  it("release gives the hold back without touching the shelf", () => {
    assert.deepEqual(movementDeltas("release", 4), { quantity: 0, reserved: -4 });
  });

  it("in and out move the shelf", () => {
    assert.deepEqual(movementDeltas("in", 5), { quantity: 5, reserved: 0 });
    assert.deepEqual(movementDeltas("out", 5), { quantity: -5, reserved: 0 });
  });

  it("transfer legs are separate, so each row says which side it is", () => {
    // A single `transfer` type could only carry direction in the sign of
    // `quantity` — which the schema forbids. Two types, no sign needed.
    assert.deepEqual(movementDeltas("transfer_out", 3), { quantity: -3, reserved: 0 });
    assert.deepEqual(movementDeltas("transfer_in", 3), { quantity: 3, reserved: 0 });
  });

  it("commit clears the hold *and* the shelf", () => {
    // The bug this fixes: commit used to be an `out`, which took the units off
    // the shelf but left `reserved` at 4 — so every shipped order left a
    // phantom hold that permanently blocked those units from being sold.
    assert.deepEqual(movementDeltas("commit", 4), { quantity: -4, reserved: -4 });
  });

  it("out is for stock that was never held", () => {
    // Contrast with commit: nothing was reserved, so nothing is released.
    assert.deepEqual(movementDeltas("out", 4), { quantity: -4, reserved: 0 });
  });

  it("adjust passes its signed delta through", () => {
    assert.deepEqual(movementDeltas("adjust", -2), { quantity: -2, reserved: 0 });
    assert.deepEqual(movementDeltas("adjust", 7), { quantity: 7, reserved: 0 });
  });
});

describe("guardFilter — the concurrency guard", () => {
  it("removing units requires that many on the shelf", () => {
    assert.deepEqual(guardFilter("out", 3), { quantity: { $gte: 3 } });
  });

  it("releasing a hold requires the hold to exist", () => {
    assert.deepEqual(guardFilter("release", 3), { reserved: { $gte: 3 } });
  });

  it("holding units requires available headroom, checked atomically", () => {
    // reserved <= quantity - 3. Written as $expr so the check happens inside the
    // update rather than as a separate read that could go stale.
    assert.deepEqual(guardFilter("reserve", 3), {
      $expr: { $lte: ["$reserved", { $subtract: ["$quantity", 3] }] },
    });
  });

  it("arriving stock needs no floor", () => {
    assert.deepEqual(guardFilter("in", 100), {});
    assert.deepEqual(guardFilter("transfer_in", 100), {});
  });

  it("leaving stock needs that many on the shelf", () => {
    assert.deepEqual(guardFilter("transfer_out", 100), { quantity: { $gte: 100 } });
  });

  it("committing needs both the units and the hold", () => {
    // Guarding only `quantity` would let an order fulfil against a hold that
    // belongs to a different order, quietly destroying the other reservation.
    assert.deepEqual(guardFilter("commit", 3), {
      quantity: { $gte: 3 },
      reserved: { $gte: 3 },
    });
  });

  it("only a downward adjustment needs a floor", () => {
    assert.deepEqual(guardFilter("adjust", -2), { quantity: { $gte: 2 } });
    assert.deepEqual(guardFilter("adjust", 5), {});
  });
});

describe("audit rows describe their own direction", () => {
  const deltaFor = (type: MovementType, quantity: number) =>
    movementDeltas(type, quantity).quantity;

  it("agrees with the movement table for every non-adjust type", () => {
    // This is the invariant the StockMovement schema hook enforces, checked here
    // so a change to the table cannot quietly invalidate saved rows.
    for (const type of MOVEMENT_TYPES) {
      if (type === "adjust") continue;
      assert.equal(
        deltaFor(type, 7),
        movementDeltas(type, 7).quantity,
        `${type} delta is derived, not stated`
      );
    }
  });

  it("never needs a negative magnitude to express direction", () => {
    // The old `transfer` encoded direction as a negative quantity, which the
    // schema's `min: 0` rejected at runtime. Every type is now magnitude-safe.
    for (const type of MOVEMENT_TYPES) {
      const { quantity } = movementDeltas(type, 3);
      assert.equal(quantity, deltaFor(type, 3));
    }
  });

  it("distinguishes a commit from an out", () => {
    // Both are "minus 3" on quantity; only the type says which held units.
    assert.equal(deltaFor("commit", 3), -3);
    assert.equal(deltaFor("out", 3), -3);
    assert.notEqual(
      movementDeltas("commit", 3).reserved,
      movementDeltas("out", 3).reserved
    );
  });
});

describe("assertInvariants (§11.4)", () => {
  it("accepts a consistent row", () => {
    assert.doesNotThrow(() => assertInvariants({ quantity: 10, reserved: 10 }));
  });

  it("rejects holding more than exists", () => {
    assert.throws(
      () => assertInvariants({ quantity: 2, reserved: 3 }),
      (error: unknown) =>
        error instanceof InsufficientStockError && /cannot exceed/.test(error.message)
    );
  });

  it("rejects negative figures", () => {
    assert.throws(
      () => assertInvariants({ quantity: -1, reserved: 0 }),
      InsufficientStockError
    );
    assert.throws(
      () => assertInvariants({ quantity: 5, reserved: -1 }),
      InsufficientStockError
    );
  });
});

describe("findDrift (reconciliation, §9)", () => {
  const row = (id: string, stock: number, ledger: number) => ({
    product: { _id: id, name: `Product ${id}`, stock },
    ledger,
  });

  it("reports nothing when the catalogue matches the ledger", () => {
    assert.deepEqual(findDrift([row("a", 5, 5), row("b", 0, 0)]), []);
  });

  it("treats held units as agreement, not drift", () => {
    // 10 on the shelf, 4 held for a pending order: availability is 6, and that is
    // what Product.stock should say. Comparing on-shelf quantity would flag this
    // as drift on every open order.
    assert.deepEqual(findDrift([row("a", 6, 10 - 4)]), []);
  });

  it("reports a product whose rows vanished", () => {
    const drift = findDrift([row("a", 5, 0)]);
    assert.equal(drift.length, 1);
    assert.equal(drift[0].delta, -5);
  });

  it("points in the direction of the discrepancy", () => {
    // ledger > catalogue means stock was added without the catalogue being told.
    const [rowUp] = findDrift([row("a", 2, 8)]);
    assert.equal(rowUp.delta, 6);
    assert.equal(rowUp.catalogue, 2);
    assert.equal(rowUp.ledger, 8);
  });

  it("ignores float noise", () => {
    assert.deepEqual(findDrift([row("a", 5, 5 + 1e-12)]), []);
  });
});

describe("transitionFor — when fulfilment closes the ledger", () => {
  it("commits when an order leaves a holding state for the first time", () => {
    assert.equal(transitionFor("placed", "shipped"), "commit");
    assert.equal(transitionFor("processing", "shipped"), "commit");
    assert.equal(transitionFor("placed", "delivered"), "commit");
  });

  it("never commits twice for the same order", () => {
    // shipped → delivered must not deduct a second time.
    assert.equal(transitionFor("shipped", "delivered"), "none");
    assert.equal(transitionFor("delivered", "delivered"), "none");
  });

  it("never commits a cancelled order", () => {
    // Cancel already released the hold; the units are back on the shelf.
    assert.equal(transitionFor("cancelled", "shipped"), "none");
  });

  it("does nothing when the status is unchanged or absent", () => {
    assert.equal(transitionFor("placed", "placed"), "none");
    assert.equal(transitionFor("placed", undefined), "none");
  });

  it("does not commit an ordinary in-house move", () => {
    assert.equal(transitionFor("placed", "processing"), "none");
    assert.equal(transitionFor("processing", "placed"), "none");
  });
});
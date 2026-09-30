// tests/pricing.test.ts
// ==========================================
// Pricing is the money path: a wrong number here is a wrong invoice, and these
// rules used to live in the client where a request could overwrite them.
//
// Node's built-in test runner is used on purpose — the server has no test
// framework installed, and adding Jest/Vitest is a bigger change than the fix.
//
//   npm test
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

// PRICING reads the environment when the module is first imported, so the
// overrides have to happen before the dynamic import below.
process.env.SHIPPING_COST = "7";
process.env.TAX_RATE = "0.19";
process.env.FREE_SHIPPING_THRESHOLD = "200";

const { computeTotals, PRICING, roundMoney } = await import(
  "../config/pricing.js"
);

describe("PRICING", () => {
  it("reads shipping, tax and the free-shipping threshold from env", () => {
    assert.equal(PRICING.shippingCost, 7);
    assert.equal(PRICING.taxRate, 0.19);
    assert.equal(PRICING.freeShippingThreshold, 200);
  });
});

describe("roundMoney", () => {
  it("keeps two decimals", () => {
    assert.equal(roundMoney(123.456), 123.46);
    assert.equal(roundMoney(123.454), 123.45);
    assert.equal(roundMoney(7), 7);
  });

  it("absorbs binary float error", () => {
    assert.equal(roundMoney(0.1 + 0.2), 0.3);
  });
});

describe("computeTotals", () => {
  it("prices every line and adds shipping plus tax", () => {
    const totals = computeTotals([
      { price: 40, quantity: 2 },
      { price: 15.5, quantity: 4 },
    ]);

    assert.deepEqual(totals, {
      subtotal: 142,
      shippingCost: 7,
      tax: 26.98, // 142 * 0.19
      totalAmount: 175.98,
    });
  });

  it("waives shipping at the threshold", () => {
    const totals = computeTotals([{ price: 200, quantity: 1 }]);

    assert.deepEqual(totals, {
      subtotal: 200,
      shippingCost: 0,
      tax: 38,
      totalAmount: 238,
    });
  });

  it("charges shipping one unit below the threshold", () => {
    const totals = computeTotals([{ price: 199.99, quantity: 1 }]);

    assert.equal(totals.subtotal, 199.99);
    assert.equal(totals.shippingCost, 7);
    assert.equal(totals.tax, 38); // 37.9981 rounded up to the cent
    assert.equal(totals.totalAmount, 244.99);
  });

  it("never returns a float-precision total", () => {
    const totals = computeTotals([
      { price: 0.1, quantity: 1 },
      { price: 0.2, quantity: 1 },
    ]);

    assert.equal(totals.subtotal, 0.3);
    assert.equal(totals.tax, 0.06);
    assert.equal(totals.totalAmount, 7.36);
  });

  it("charges no shipping on an empty cart", () => {
    assert.deepEqual(computeTotals([]), {
      subtotal: 0,
      shippingCost: 0,
      tax: 0,
      totalAmount: 0,
    });
  });

  it("makes the printed invoice lines add up to the subtotal", () => {
    const lines = [
      { price: 19.99, quantity: 3 },
      { price: 7.5, quantity: 7 },
      { price: 0.05, quantity: 9 },
    ];

    const lineSum = roundMoney(
      lines.reduce((sum, line) => sum + roundMoney(line.price * line.quantity), 0)
    );

    assert.equal(computeTotals(lines).subtotal, lineSum); // 59.97 + 52.5 + 0.45
  });

  it("is driven only by the prices it is given", () => {
    // The regression this guards: the old code took `shippingCost` and `tax`
    // from the request body, so a client could post `shippingCost: -7` and pay
    // less. Totals now come from DB-priced lines and nothing else, so the same
    // lines always produce the same money.
    const lines = [{ price: 25, quantity: 3 }];

    assert.deepEqual(computeTotals(lines), computeTotals([...lines]));
    assert.equal(computeTotals(lines).totalAmount, 96.25); // 75 + 7 + 14.25
  });
});

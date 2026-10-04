// tests/validate.test.ts
// ==========================================
//   Request-body validation.
//
// Each group below is one way a value can slip past a `typeof x === "number"`
// check or a relational comparison, because those are the only ways input has
// been reaching this API. The string cases are the important ones: they are
// accepted silently by `<`, `<=`, `>` and `>=`, and by Mongoose's Number cast.
//
// Assertions are on the thrown AppError's status as well as its message, since
// the whole point is that a bad body is the caller's problem and must be a 400.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  asFiniteNumber,
  asInteger,
  asOneOf,
  asOptionalString,
  asPositiveInteger,
  asString,
} from "../utils/validate.js";

/** Assert the call throws a 400 AppError mentioning `field`. */
const rejects = (fn: () => unknown, field: string, because?: string): void => {
  try {
    fn();
  } catch (error) {
    assert.equal(
      (error as { status?: number }).status,
      400,
      `${because ?? "should be a 400"} — got ${String(error)}`
    );
    assert.match((error as Error).message, new RegExp(field));
    return;
  }
  assert.fail(`${because ?? "should have been rejected"}: ${field}`);
};

describe("asFiniteNumber", () => {
  it("accepts a real number", () => {
    assert.equal(asFiniteNumber(3, "quantity"), 3);
    assert.equal(asFiniteNumber(-2.5, "quantity"), -2.5);
  });

  it("rejects the values a typeof check alone would let through", () => {
    // NaN is a number. `NaN < 1` is false, so `min` never rejects it, and a
    // quantity of NaN passes straight through a stock check.
    rejects(() => asFiniteNumber(NaN, "quantity"), "quantity", "NaN is a number");
    rejects(() => asFiniteNumber(Infinity, "quantity"), "quantity");
    rejects(() => asFiniteNumber(-Infinity, "quantity"), "quantity");
  });

  it("rejects values that only look numeric", () => {
    // All four satisfy every relational comparison in CartController.
    for (const bad of ["5", "abc", true, {}, []]) {
      rejects(() => asFiniteNumber(bad, "quantity"), "quantity", `received ${typeof bad}`);
    }
  });

  it("honours bounds, and reports which one failed", () => {
    assert.equal(asFiniteNumber(5, "quantity", { min: 1, max: 99 }), 5);
    rejects(() => asFiniteNumber(0, "quantity", { min: 1 }), "quantity");
    rejects(() => asFiniteNumber(100, "quantity", { max: 99 }), "quantity");
  });
});

describe("asInteger", () => {
  it("rejects fractions rather than rounding them", () => {
    // Rounding hides a client bug that would otherwise surface as a stock
    // discrepancy between what was ordered and what was picked.
    rejects(() => asInteger(1.5, "quantity"), "quantity");
    assert.equal(asInteger(2, "quantity"), 2);
  });

  it("allows zero and negatives, because callers decide what they mean", () => {
    // updateCartItem treats <= 0 as "remove this line". Rejecting them here
    // would change that behaviour, so the decision stays with the caller.
    assert.equal(asInteger(0, "quantity"), 0);
    assert.equal(asInteger(-1, "quantity"), -1);
  });
});

describe("asPositiveInteger", () => {
  it("rejects zero and negatives", () => {
    rejects(() => asPositiveInteger(0, "quantity"), "quantity");
    rejects(() => asPositiveInteger(-3, "quantity"), "quantity");
    rejects(() => asPositiveInteger(NaN, "quantity"), "quantity");
  });

  it("rejects a string that would otherwise coerce", () => {
    // The original bug: "abc" <= 0 is false, so the guard never fired.
    rejects(() => asPositiveInteger("abc", "quantity"), "quantity");
    rejects(() => asPositiveInteger("3", "quantity"), "quantity");
  });

  it("accepts a whole number within bounds", () => {
    assert.equal(asPositiveInteger(3, "quantity", { max: 10 }), 3);
    rejects(() => asPositiveInteger(11, "quantity", { max: 10 }), "quantity");
  });
});
describe("asString", () => {
  it("trims and accepts ordinary text", () => {
    assert.equal(asString("  عطور  ", "title"), "عطور");
  });

  it("rejects non-strings rather than stringifying them", () => {
    // String({}) is "[object Object]", which would then be stored as a title.
    for (const bad of [123, true, {}, ["a"], null]) {
      rejects(() => asString(bad, "title"), "title");
    }
  });

  it("rejects blank and over-long values", () => {
    rejects(() => asString("   ", "title"), "title");
    rejects(() => asString("x".repeat(51), "title", { maxLength: 50 }), "title");
    assert.equal(asString("x".repeat(50), "title", { maxLength: 50 }).length, 50);
  });

  it("can preserve whitespace when it is meaningful", () => {
    assert.equal(asString("  a  ", "title", { trim: false }), "  a  ");
  });
});

describe("asOptionalString", () => {
  it("treats absent, null and blank as the same thing", () => {
    assert.equal(asOptionalString(undefined, "note"), undefined);
    assert.equal(asOptionalString(null, "note"), undefined);
    assert.equal(asOptionalString("", "note"), undefined);
    assert.equal(asOptionalString("   ", "note"), undefined);
  });

  it("still validates a value that is present", () => {
    assert.equal(asOptionalString(" hello ", "note"), "hello");
    rejects(() => asOptionalString(123, "note"), "note");
    rejects(() => asOptionalString("x".repeat(600), "note", { maxLength: 100 }), "note");
  });
});

describe("asOneOf", () => {
  const ALLOWED = ["placed", "shipped", "delivered"] as const;

  it("accepts a member and rejects anything else", () => {
    assert.equal(asOneOf("shipped", "orderStatus", ALLOWED), "shipped");
    // A typo becoming a status would be silent and permanent.
    rejects(() => asOneOf("Shipped", "orderStatus", ALLOWED), "orderStatus");
    rejects(() => asOneOf("shippedd", "orderStatus", ALLOWED), "orderStatus");
    rejects(() => asOneOf(1, "orderStatus", ALLOWED), "orderStatus");
  });

  it("lists the allowed values so the caller can correct itself", () => {
    try {
      asOneOf("nope", "orderStatus", ALLOWED);
    } catch (error) {
      assert.match((error as Error).message, /placed, shipped, delivered/);
    }
  });
});
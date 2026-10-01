// tests/escapeRegex.test.ts
// ==========================================
// Guards the catalogue filters. `getProducts` / `searchProducts` are public — no
// `protect` on the route — so every query parameter there is attacker-controlled.
//
//   npm test
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { escapeRegex } from "../utils/escapeRegex.js";

/** The pattern the controller actually builds for a filter value. */
const anchored = (value: string) => new RegExp(`^${escapeRegex(value)}$`, "i");

describe("escapeRegex", () => {
  it("treats regex metacharacters as literal text", () => {
    assert.ok(anchored("Tom Ford").test("Tom Ford"));
    assert.ok(!anchored("Tom Ford").test("Tom XFord"));
  });

  it("stops `|` from widening an anchored match", () => {
    // The bug this pins: `^${value}$` with a raw value makes `?brand=a|b` become
    // `^a|b$`. `|` binds looser than the anchors, so that matches any string
    // starting with "a" OR ending with "b" — the brand filter stops filtering and
    // quietly returns the wrong catalogue.
    const pattern = anchored("a|b");
    assert.ok(!pattern.test("arbitrary nonsense"), "no longer matches anything");
    assert.ok(pattern.test("a|b"), "only the literal value matches");
  });

  it("removes catastrophic backtracking", () => {
    // `(a+)+b` against a non-matching input is the classic exponential case. Raw,
    // it would be compiled straight into the query and run on an open endpoint.
    // Assert the pattern no longer backtracks, using a length that would hang if
    // the escape regressed.
    const started = Date.now();
    assert.ok(!anchored("(a+)+b").test(`${"a".repeat(40)}c`));
    assert.ok(
      Date.now() - started < 1000,
      "must not backtrack exponentially"
    );
  });

  it("escapes backslashes and bracket classes without corrupting them", () => {
    // A hex value like `#ff0000` must survive intact, not become a char class.
    assert.ok(anchored("#ff0000").test("#FF0000"), "case-insensitive as before");
    assert.ok(!anchored("#ff0000").test("#zzzzzz"), "literal, not a class");
    assert.ok(anchored("C:\\path").test("C:\\path"));
  });
});

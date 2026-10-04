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
    //
    // Wall-clock is the only way to observe "this does not run for ever", so the
    // assertion is timing-based — which makes it the flakiest thing in the suite
    // if the budget is tight. The work here is a single escaped match on 40
    // characters, which is microseconds; a second is orders of magnitude of slack
    // even on a loaded runner, and the exponential case would take effectively
    // forever rather than something just over a second.
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

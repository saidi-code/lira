// tests/isDirectRun.test.ts
// ==========================================
// The entry-point guard on the maintenance scripts.
//
// This exists because the previous guard was too loose and actually fired: it used
// `argv[1].includes("<scriptName>")`, and `tests/productIndexes.integration.test.ts`
// contains "productIndexes". Loading that test therefore ran the script's `main()`,
// which immediately tried to connect to whatever `DB_URI` pointed at — a live
// production cluster on the machine it was written on.
//
// A maintenance script must never begin running because a test imported it.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isDirectRun } from "../utils/isDirectRun.js";

/** argv[0] is the interpreter; argv[1] is the entry point. */
const argv = (entry?: string) => (entry ? ["node", entry] : ["node"]);

describe("isDirectRun", () => {
  it("is true when the script is the entry point", () => {
    assert.equal(isDirectRun("productIndexes", argv("scripts/productIndexes.ts")), true);
    assert.equal(isDirectRun("reconcileStock", argv("scripts/reconcileStock.ts")), true);
  });

  it("is false for a test file named after the script", () => {
    // The exact case that broke: `includes` said yes, this says no.
    assert.equal(
      isDirectRun("productIndexes", argv("tests/productIndexes.integration.test.ts")),
      false
    );
    assert.equal(
      isDirectRun("reconcileStock", argv("tests/reconcileStock.test.ts")),
      false
    );
  });

  it("is false when the script is imported by another script", () => {
    assert.equal(isDirectRun("productIndexes", argv("scripts/seedWarehouses.ts")), false);
  });

  it("is false when there is no entry point", () => {
    // `node -e`, or a REPL: nothing to run.
    assert.equal(isDirectRun("productIndexes", argv()), false);
    assert.equal(isDirectRun("productIndexes", []), false);
  });

  it("ignores the directory, so any path to the script works", () => {
    assert.equal(isDirectRun("productIndexes", argv("C:/repo/server/scripts/productIndexes.ts")), true);
    assert.equal(isDirectRun("productIndexes", argv("/repo/server/scripts/productIndexes.ts")), true);
  });

  it("does not match a different script with a similar name", () => {
    assert.equal(isDirectRun("productIndexes", argv("scripts/productIndexesOld.ts")), false);
  });
});
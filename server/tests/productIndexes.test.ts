// tests/productIndexes.test.ts
// ==========================================
// The decision rules behind `npm run indexes:products`.
//
// These are pure, so they are tested here rather than only against a database.
// The rules matter because the script's `--fix` drops indexes: getting
// "extraneous" wrong either leaves the broken state in place or removes an index
// somebody added on purpose.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDbUri } from "../config/db.js";
import {
  classifyIndexes,
  keySignature,
  type IndexSpec,
} from "../scripts/productIndexes.js";

const index = (
  name: string,
  key: Record<string, number | string>,
  weights?: Record<string, number>
): IndexSpec => ({ name, key, ...(weights ? { weights } : {}) });

/** The primary key, which MongoDB always has and no schema declares. */
const primaryKey = index("_id_", { _id: 1 });

/** What the server actually reports for a text index — not the field names. */
const textIndex = (name: string, field: string) =>
  index(name, { _fts: "text", _ftsx: 1 }, { [field]: 1 });

const declaredBrand = index("isActive_1_brand_1", { isActive: 1, brand: 1 });

describe("keySignature", () => {
  it("is order sensitive, matching how the server stores a key", () => {
    assert.equal(
      keySignature({ isActive: 1, createdAt: -1 }),
      "isActive:1,createdAt:-1"
    );
  });

  it("distinguishes direction", () => {
    assert.notEqual(keySignature({ price: 1 }), keySignature({ price: -1 }));
  });
});

describe("classifyIndexes", () => {
  it("treats a matching key as declared", () => {
    const report = classifyIndexes([primaryKey, declaredBrand], [declaredBrand]);

    assert.deepEqual(report.declared, [declaredBrand]);
    assert.deepEqual(report.extraneous, []);
  });

  it("never reports the primary key as extraneous", () => {
    // No schema declares `_id_`, so without an explicit exemption every run
    // would offer to drop the primary key.
    const report = classifyIndexes([primaryKey], []);

    assert.deepEqual(report.extraneous, []);
  });

  it("finds a text index from the server's own key shape", () => {
    // A text index arrives as `{_fts: 'text', _ftsx: 1}` with the real field only
    // in `weights`, so detecting it by field name would never match.
    const stale = textIndex("subtitle_text", "subtitle");
    const report = classifyIndexes([primaryKey, stale], [declaredBrand]);

    assert.deepEqual(report.staleText, [stale]);
    assert.deepEqual(report.extraneous, [stale]);
  });

  it("reports a non-text index it does not recognise as extraneous, not stale", () => {
    const handMade = index("subtitle_1", { subtitle: 1 });
    const report = classifyIndexes([primaryKey, handMade], []);

    assert.deepEqual(report.extraneous, [handMade]);
    assert.deepEqual(report.staleText, [], "only text indexes are droppable");
  });

  it("separates stale text from other extraneous indexes", () => {
    const stale = textIndex("name_text", "name");
    const handMade = index("subtitle_1", { subtitle: 1 });
    const report = classifyIndexes([primaryKey, stale, handMade], [declaredBrand]);

    assert.deepEqual(report.staleText, [stale]);
    assert.equal(report.extraneous.length, 2);
  });

  it("handles a collection with no indexes beyond the primary key", () => {
    const report = classifyIndexes([primaryKey], [declaredBrand]);

    assert.deepEqual(report.extraneous, []);
    assert.deepEqual(report.staleText, []);
    assert.deepEqual(report.declared, []);
  });
});

describe("resolveDbUri", () => {
  it("appends DB_NAME to the base URI", () => {
    assert.equal(
      resolveDbUri({
        DB_URI: "mongodb+srv://u:p@cluster.example.net/",
        DB_NAME: "shop",
      }),
      "mongodb+srv://u:p@cluster.example.net/shop"
    );
  });

  it("replaces a database already in the path", () => {
    // The base URI may name a database that is not the one being used; DB_NAME wins.
    assert.equal(
      resolveDbUri({
        DB_URI: "mongodb+srv://u:p@cluster.example.net/olddb",
        DB_NAME: "shop",
      }),
      "mongodb+srv://u:p@cluster.example.net/shop"
    );
  });

  it("drops query parameters, which would otherwise land in the database name", () => {
    assert.equal(
      resolveDbUri({
        DB_URI: "mongodb+srv://u:p@cluster.example.net/olddb?retryWrites=true&w=majority",
        DB_NAME: "shop",
      }),
      "mongodb+srv://u:p@cluster.example.net/shop"
    );
  });

  it("prefers MONGODB_URI_BASE over DB_URI", () => {
    assert.equal(
      resolveDbUri({
        MONGODB_URI_BASE: "mongodb://localhost:27017/",
        DB_URI: "mongodb://ignored:27017/",
        DB_NAME: "shop",
      }),
      "mongodb://localhost:27017/shop"
    );
  });

  it("throws rather than connecting to an unintended database", () => {
    // Silently defaulting here would point a maintenance script at the wrong
    // database, so this must fail loudly.
    assert.throws(() => resolveDbUri({ DB_URI: "mongodb://localhost:27017/" }));
    assert.throws(() => resolveDbUri({ DB_NAME: "shop" }));
    assert.throws(() => resolveDbUri({}));
  });

  it("collapses to an unusable URI when the base has no database path", () => {
    // Pinning real behaviour rather than an assumption — an earlier guess at this
    // was wrong. The regex removes everything after the final `/`, and the second
    // pass then strips the `//` as well, so credentials and host are both lost and
    // only `mongodb+srv:` survives.
    //
    // The failure is loud: the driver rejects this URI, so it cannot silently
    // connect somewhere unintended. It does mean a pathless `DB_URI` fails at
    // connect time, which is why `.env.example` always shows a database path.
    assert.equal(
      resolveDbUri({ DB_URI: "mongodb+srv://u:p@cluster.example.net", DB_NAME: "shop" }),
      "mongodb+srv:/shop"
    );
  });
});
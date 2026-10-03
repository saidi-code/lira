// tests/productIndexes.integration.test.ts
// ==========================================
// THE PRODUCT INDEX CLEANUP, AGAINST A REAL MONGODB
// ==========================================
// The unit tests cover the decision rules. This covers the part that only exists
// against a server: that a text index really is detectable from the shape Mongo
// returns, that dropping it really removes it, and that the declared indexes can
// then actually be built.
//
// That last point is the whole reason the script exists. Two conflicting text
// indexes used to be declared on the schemas embedded in `Product`, so
// `Product.init()` threw, `db.ts` swallowed the error, and **no Product index was
// ever built** — every query silently fell back to a collection scan.
//
// The connection is opened with `autoIndex: false` on purpose. Otherwise mongoose
// builds the declared indexes in the background as soon as it connects, which
// would make "nothing extraneous is present" true for reasons unrelated to the
// test, and could re-add indexes mid-assertion.
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer, LAUNCH_TIMEOUT_MS } from "./mongod.js";

import Product from "../../models/Products.js";
import {
  dropStaleProductIndexes,
  inspectProductIndexes,
} from "../../scripts/productIndexes.js";

let mongod: MongoMemoryServer;
const quiet = () => undefined;

/** A collection that does not exist yet has nothing to drop. */
const NAMESPACE_NOT_FOUND = 26;

const resetProductCollection = async () => {
  try {
    await Product.collection.drop();
  } catch (error) {
    if ((error as { code?: number }).code !== NAMESPACE_NOT_FOUND) throw error;
  }
};

const indexNames = async () =>
  (await Product.collection.indexes()).map((i) => i.name);

before(async () => {
  mongod = await MongoMemoryServer.create({ instance: { launchTimeout: LAUNCH_TIMEOUT_MS } });
  // See the header: this is what makes the assertions mean anything.
  await mongoose.connect(mongod.getUri(), { autoIndex: false });
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(resetProductCollection);

describe("product index cleanup, against a real database", () => {
  it("detects a text index the schema does not declare", async () => {
    await Product.collection.createIndex({ subtitle: "text" });

    const report = await inspectProductIndexes({ log: quiet });

    assert.deepEqual(
      report.staleText.map((i) => i.name),
      ["subtitle_text"]
    );
    assert.ok(
      report.extraneous.some((i) => i.name === "subtitle_text"),
      "it is extraneous as well as stale"
    );
  });

  it("never offers to drop the primary key", async () => {
    await Product.collection.createIndex({ subtitle: "text" });

    const report = await inspectProductIndexes({ log: quiet });

    assert.ok(!report.extraneous.some((i) => i.name === "_id_"));
  });

  it("reports nothing extraneous once only declared indexes exist", async () => {
    await Product.createIndexes();

    const report = await inspectProductIndexes({ log: quiet });

    assert.equal(report.extraneous.length, 0);
    assert.equal(
      report.declared.length,
      Product.schema.indexes().length,
      "every declared index was actually built"
    );
  });

  it("drops the stale text index and builds the declared ones", async () => {
    await Product.collection.createIndex({ subtitle: "text" });
    assert.ok((await indexNames()).includes("subtitle_text"));

    const result = await dropStaleProductIndexes({ log: quiet });

    assert.deepEqual(result.dropped, ["subtitle_text"]);
    assert.ok(
      !(await indexNames()).includes("subtitle_text"),
      "the conflicting text index is gone"
    );

    // The half that used to fail silently: with the conflict removed, the
    // declared indexes can finally be created.
    const report = await inspectProductIndexes({ log: quiet });
    assert.equal(
      report.declared.length,
      Product.schema.indexes().length,
      "the schema's indexes now exist"
    );
    assert.equal(report.staleText.length, 0);
  });

  it("is idempotent — a second run finds nothing to drop", async () => {
    await Product.collection.createIndex({ subtitle: "text" });
    await dropStaleProductIndexes({ log: quiet });

    const second = await dropStaleProductIndexes({ log: quiet });

    assert.deepEqual(second.dropped, []);
    assert.deepEqual(second.leftAlone, []);
  });

  it("leaves a non-text extraneous index alone", async () => {
    // It might have been added by hand for a reason the script cannot see, and a
    // dropped index is not something a report can put back.
    await Product.collection.createIndex({ subtitle: 1 });

    const result = await dropStaleProductIndexes({ log: quiet });

    assert.deepEqual(result.dropped, []);
    assert.deepEqual(result.leftAlone, ["subtitle_1"]);
    assert.ok(
      (await indexNames()).includes("subtitle_1"),
      "still present, deliberately"
    );
  });

  it("does not disturb a document that is already stored", async () => {
    const product = await Product.create({
      name: "Oud Wood 50ml",
      sku: "SMP-1",
      subtitle: "s",
      description: "d",
      category: new mongoose.Types.ObjectId(),
      subCategory: "man",
      brand: "Lyra",
      price: 120,
      stock: 0,
    });
    await Product.collection.createIndex({ subtitle: "text" });

    await dropStaleProductIndexes({ log: quiet });

    const reread = await Product.findById(product._id).lean();
    assert.ok(reread, "the document survived the index change");
    assert.equal(reread?.sku, "SMP-1");
  });
});
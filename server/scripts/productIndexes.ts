// scripts/productIndexes.ts
// ==========================================
// ONE-OFF INDEX CLEANUP
// ==========================================
//   npm run indexes:products          report only
//   npm run indexes:products -- --fix drop the stale text indexes
//
// Two text indexes used to be declared on the schemas embedded inside `Product`
// (`colors` and `variants`). Mongo allows only one text index per collection, so
// `Product.init()` threw on every boot, `db.ts` logged and continued, and **no
// Product index was ever built** — every query that should have used one fell
// back to a collection scan. The declarations have been removed from the
// schemas, but the indexes themselves are still on the collection, because the
// connect path uses `createIndexes()`, which only ever adds.
//
// `syncIndexes()` would remove them, and is deliberately not used: it also drops
// any index the schema does not declare, which on a live database can silently
// delete a unique constraint. So the removal is explicit, here, and read-only
// until asked.
//
// Report mode touches nothing: it connects with `autoIndex: false` so that
// merely inspecting the indexes cannot create any.
// ==========================================
import "dotenv/config";
import mongoose from "mongoose";

import { resolveDbUri } from "../config/db.js";
import Product from "../models/Products.js";
import { isDirectRun } from "../utils/isDirectRun.js";

export interface IndexSpec {
  name: string;
  key: Record<string, number | string>;
  /** Present only on text indexes; names the fields that index covers. */
  weights?: Record<string, number>;
}

export interface IndexReport {
  present: IndexSpec[];
  declared: IndexSpec[];
  /** Present but not declared by the schema — reported, never dropped silently. */
  extraneous: IndexSpec[];
  /** The extraneous text indexes: the ones this script exists to remove. */
  staleText: IndexSpec[];
}

export interface IndexOptions {
  log?: (message: string) => void;
}

/**
 * A stable signature for an index key.
 *
 * The schema and the server describe the same index differently — the server
 * returns `{ _fts: 'text', _ftsx: 1 }` for a text index, with the real fields in
 * `weights` — so comparison happens on the key that is actually in common.
 */
export const keySignature = (key: Record<string, number | string>): string =>
  Object.entries(key)
    .map(([field, direction]) => `${field}:${direction}`)
    .join(",");

/**
 * Split the indexes that exist into declared, extraneous, and stale-text.
 *
 * Pure, so the decision rules are unit-tested rather than only exercised against
 * a live database.
 */
export const classifyIndexes = (
  present: IndexSpec[],
  declared: IndexSpec[]
): IndexReport => {
  const declaredSignatures = new Set(declared.map((i) => keySignature(i.key)));

  const isDeclared = (i: IndexSpec) =>
    declaredSignatures.has(keySignature(i.key));

  // Mongo's own primary key is never declared by a schema and can never be
  // dropped; without this it would be reported as extraneous every time.
  const isPrimaryKey = (i: IndexSpec) => i.name === "_id_";

  const isText = (i: IndexSpec) => Object.values(i.key).includes("text");

  const extraneous = present.filter(
    (i) => !isDeclared(i) && !isPrimaryKey(i)
  );

  return {
    present,
    declared: present.filter(isDeclared),
    extraneous,
    staleText: extraneous.filter(isText),
  };
};

/** Read what exists on the collection and compare it to the schema. Writes nothing. */
export const inspectProductIndexes = async ({
  log = console.log,
}: IndexOptions = {}): Promise<IndexReport> => {
  const declared: IndexSpec[] = Product.schema.indexes().map(
    ([key, options]) => ({
      name: options.name ?? "(schema-declared)",
      key: key as Record<string, number | string>,
    })
  );

  let present: IndexSpec[] = [];
  try {
    present = (await Product.collection.indexes()).map((index) => ({
      name: index.name ?? "(unnamed)",
      key: index.key as Record<string, number | string>,
      ...(index.weights
        ? { weights: index.weights as Record<string, number> }
        : {}),
    }));
  } catch (error) {
    // A collection that has never been written has no indexes to list.
    log(`Could not list indexes on "products": ${(error as Error).message}`);
  }

  const report = classifyIndexes(present, declared);
  const staleNames = new Set(report.staleText.map((i) => i.name));

  log(
    `products: ${report.present.length} index(es) present, ` +
      `${report.declared.length} matching the schema.`
  );

  for (const index of report.declared) {
    log(`  declared    ${index.name}`);
  }

  if (report.extraneous.length === 0) {
    log("\nNothing extraneous — every index on the collection is declared.");
    return report;
  }

  log(`\n${report.extraneous.length} index(es) NOT declared by the schema:`);
  for (const index of report.extraneous) {
    const fields = index.weights
      ? ` on ${Object.keys(index.weights).join(", ")}`
      : "";
    log(
      `  ${staleNames.has(index.name) ? "STALE TEXT" : "unexpected"}  ` +
        `${index.name}${fields}`
    );
  }
  return report;
};

export interface FixResult {
  dropped: string[];
  /** Declared indexes confirmed present after the build. */
  ensured: string[];
  /** Extraneous but not a text index — reported, never dropped. */
  leftAlone: string[];
}

export const dropStaleProductIndexes = async ({
  log = console.log,
}: IndexOptions = {}): Promise<FixResult> => {
  const report = await inspectProductIndexes({ log });

  if (report.staleText.length === 0) {
    log("\nNo stale text indexes to drop.");
  } else {
    log("\nDropping the stale text indexes…");
    for (const index of report.staleText) {
      await Product.collection.dropIndex(index.name);
      log(`  dropped  ${index.name}`);
    }
  }

  // The half that was silently failing before: with the conflicting text indexes
  // gone, the declared indexes can actually be built.
  //
  // The return value is deliberately ignored: `Model.createIndexes()` resolves to
  // undefined on this mongoose version, and what matters is not what the driver
  // claims to have created but which declared indexes actually exist afterwards.
  // That is read back below.
  await Product.createIndexes();

  // A non-text index the schema does not declare may have been added by hand for
  // a reason this script cannot see, so it is reported and left in place. Removing
  // the wrong index is not something a report can undo.
  const staleNames = new Set(report.staleText.map((i) => i.name));
  const leftAlone = report.extraneous
    .filter((i) => !staleNames.has(i.name))
    .map((i) => i.name);

  if (leftAlone.length > 0) {
    log("\nLeft alone — not text indexes, so possibly deliberate:");
    for (const name of leftAlone) {
      log(`  ${name}`);
    }
  }

  log("\nFinal state:");
  const finalState = await inspectProductIndexes({ log });

  return {
    dropped: report.staleText.map((i) => i.name),
    ensured: finalState.declared.map((i) => i.name),
    leftAlone,
  };
};

const connectForInspection = async () => {
  // `autoIndex: false` matters: without it, connecting would build the declared
  // indexes, so even the *report* would change the database — and could not then
  // be trusted as a description of what was already there.
  await mongoose.connect(resolveDbUri(), { autoIndex: false });
};

const logActionRequired = () =>
  console.log("\nRe-run with --fix to drop the stale text indexes.");

const main = async () => {
  const fix = process.argv.includes("--fix");
  await connectForInspection();

  let exitCode = 0;
  try {
    if (fix) {
      await dropStaleProductIndexes({});
    } else {
      const report = await inspectProductIndexes({});
      // Exit 2 when there is something to do, so a check can tell "clean" from
      // "clean up after me" without parsing the output.
      exitCode = report.staleText.length > 0 ? 2 : 0;
      if (exitCode === 2) {
        logActionRequired();
      }
    }
  } finally {
    await mongoose.connection.close();
  }

  process.exit(exitCode);
};

// Only run when executed directly, so importing this for a test is inert.
if (isDirectRun("productIndexes")) {
  main().catch(async (error) => {
    console.error("indexes:products failed:", error);
    await mongoose.connection.close().catch(() => undefined);
    process.exit(1);
  });
}
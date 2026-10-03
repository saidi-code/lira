// scripts/auditPublicRoutes.ts
// ==========================================
//   Read-only check for damage from the unauthenticated category/collection
//   routes that existed before `75dc770`.
//
// `categoriesRoutes.ts` and `collectionsRoutes.ts` registered their writes with no
// middleware, so anyone could POST /categories, DELETE /categories/:id, and the
// same on collections. Those endpoints are live on the deployed API, so the
// first question is whether anything was actually created or removed.
//
// Read-only by design: it counts and lists, and it never writes. Exit code is 0
// whether or not it finds anything — this is a report, not a gate, so a surprise
// in production cannot fail a deploy.
//
// Run it with: npm run audit:public-routes
// ==========================================
import "dotenv/config";
import mongoose from "mongoose";

import Category from "../models/Categories.js";
import Collection from "../models/Collections.js";
import { resolveDbUri } from "../config/db.js";

/**
 * Anything this recent is suspicious rather than proof.
 *
 * The routes were reachable for the life of the deployment, so the honest
 * question is not "was this exploited" but "is there a row I cannot account for".
 * A row dated minutes before a legitimate admin edit is far more likely to be
 * someone testing the fix than an attacker, which is why this is a report.
 */
const RECENT_HOURS = 24 * 30;

interface Finding {
  readonly label: string;
  readonly total: number;
  /** Rows that carry a usable `createdAt`. */
  readonly datable: number;
  /** Rows with no `createdAt`, which cannot be aged at all. */
  readonly undatable: number;
  readonly recent: number;
  readonly rows: readonly { title: string; createdAt: Date | null }[];
}

const audit = async (): Promise<readonly Finding[]> => {
  const since = new Date(Date.now() - RECENT_HOURS * 60 * 60 * 1000);

  const [categories, collections] = await Promise.all([
    Category.find({}, { title: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    Collection.find({}, { title: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
  ]);

  const shape = (
    label: string,
    rows: readonly { title?: string; createdAt?: Date }[]
  ): Finding => {
    // Only rows that actually carry a timestamp can be aged. Counting the rest as
    // "not recent" would report a clean bill of health purely because the data
    // is undatable — which is exactly the wrong conclusion, and what an earlier
    // version of this script did.
    const dated = rows.filter(
      (row): row is { title?: string; createdAt: Date } =>
        row.createdAt instanceof Date && !Number.isNaN(row.createdAt.getTime())
    );

    return {
      label,
      total: rows.length,
      datable: dated.length,
      undatable: rows.length - dated.length,
      recent: dated.filter((row) => row.createdAt > since).length,
      rows: [...dated, ...rows.filter((row) => !dated.includes(row as never))]
        .slice(0, 25)
        .map((row) => ({ title: row.title ?? "(untitled)", createdAt: row.createdAt ?? null })),
    };
  };

  return [
    shape("categories", categories),
    shape("collections", collections),
  ];
};

const run = async (): Promise<void> => {
  await mongoose.connect(resolveDbUri());

  try {
    const findings = await audit();

    console.log("\nPublic-route audit (read-only)");
    console.log(`Rows created in the last ${RECENT_HOURS / 24} days are listed first.\n`);

    for (const finding of findings) {
      console.log(`${finding.label}: ${finding.total} total`);
      console.log(
        `  ${finding.datable} carry createdAt, ${finding.undatable} do not, ` +
          `${finding.recent} created in the last ${RECENT_HOURS / 24} days`
      );

      for (const row of finding.rows) {
        console.log(`  - ${row.title}  (${row.createdAt?.toISOString() ?? "no timestamp"})`);
      }

      // The honest headline: a table where nothing can be dated proves nothing
      // about whether it was written to while the routes were open.
      if (finding.undatable === finding.total && finding.total > 0) {
        console.log(
          `  !! none of these rows can be dated, so this table CANNOT answer ` +
            "whether anything was added or removed. Every title above needs to " +
            "be one you recognise — that is the whole check."
        );
      }
      console.log("");
    }

    console.log(
      "Nothing here proves an attack, and an empty list does not prove one did " +
        "not happen — a deleted category leaves no trace. This only tells you " +
        "whether every row present is one you recognise."
    );
  } finally {
    await mongoose.disconnect();
  }
};

await run();
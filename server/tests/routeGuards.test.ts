// tests/routeGuards.test.ts
// ==========================================
//   Every write route requires a session and a role.
//
// `categoriesRoutes.ts` and `collectionsRoutes.ts` were registered with no
// middleware at all, so `POST /api/v1/categories`, `PUT`/`DELETE` on both of
// them, and all five collection routes were reachable by anyone on the internet
// — including `createCategory`, which writes to the database. Reads were public
// and had to stay that way: the storefront browses both without a session.
//
// This reads the route files rather than trusting a list, because the failure it
// is for is a route that simply lacks a guard, and a hand-written list would
// agree with whatever the code happens to be.
//
// The assertion is per-route, so adding a new unguarded route fails even though
// the guarded ones pass.
// ==========================================
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROUTES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "routes"
);

/** HTTP methods that change something. */
const WRITE_METHODS = new Set(["post", "put", "patch", "delete"]);

/**
 * Routes that are deliberately open.
 *
 * `pricing` is public because checkout reads the shipping and tax rules before a
 * session exists. The internal sweep has no Clerk session either; it is guarded
 * by `CRON_SECRET` inside the handler instead, tested in `cronAuth.test.ts`.
 */
const OPEN_BY_DESIGN = new Set(["pricingRoutes.ts", "internalRoutes.ts"]);

/**
 * Routers where a *write* also has to be staff-only.
 *
 * Not every write is staff-only, and pretending otherwise would demand a role
 * gate where none belongs: a customer creating a cart, placing an order,
 * cancelling their own order, or managing their own addresses is the whole point
 * of those routes. What those need is a *session*, which the first assertion
 * covers.
 *
 * These routers manage global catalogue data — there is no per-owner version of a
 * category or a collection, so nobody but staff should be able to change one.
 */
const STAFF_ONLY_WRITES = new Set([
  "adminRoutes.ts",
  "categoriesRoutes.ts",
  "collectionsRoutes.ts",
  "inventoryRoutes.ts",
  "purchaseOrderRoutes.ts",
  "supplierRoutes.ts",
  "transferRoutes.ts",
  "warehouseRoutes.ts",
  "productsRoutes.ts",
]);

/** One `router.post('/x', protect, authorize('admin'), handler)` call. */
type RouteCall = {
  readonly method: string;
  readonly path: string;
  readonly guarded: boolean;
  readonly role: string | null;
};

const parseRoutes = (source: string): RouteCall[] => {
  // `router.use(protect)` — and `router.use(protect, authorize('admin'))`, which is
  // how the admin router gates itself. Both apply to every route below them.
  const routerWideProtect = /^\s*\w+\.use\(\s*protect\b/m.test(source);
  const routerWideAuthorize =
    /^\s*\w+\.use\([^)]*authorize\(\s*['"](\w+)['"]/m.exec(source)?.[1] ?? null;

  // Matches `router.get('/x', a, b)` / `productsRouter.post(...)`. The argument
  // tail is captured one char at a time so a nested call does not truncate it —
  // `productsRouter.post('/', upload.array("images", 5), protect, …)` has a comma
  // inside `upload.array(...)`, and a naive `[^)]*` stops before `protect` and
  // reports a route that is in fact guarded.
  const calls = source.matchAll(
    /(\w+Router|\w+)\.(get|post|put|patch|delete)\(\s*(['"][^'"]*['"])([\s\S]*?)\)(?=;|\s*$|\r?\n)/g
  );

  return [...calls].map(([, routerName, method, routePath, rest]) => {
    // Only a router declaration counts — a `res.get(...)` elsewhere is not a route.
    if (!/router/i.test(routerName!)) return null;

    const guarded = /\bprotect\b/.test(rest) || routerWideProtect;
    const role =
      /authorize\(\s*['"](\w+)['"]/.exec(rest)?.[1] ?? routerWideAuthorize ?? null;

    return { method: method!.toLowerCase(), path: routePath!, guarded, role };
  }).filter((call): call is RouteCall => call !== null);
};

describe("route guards", () => {
  const files = readdirSync(ROUTES_DIR).filter((name) => name.endsWith(".ts"));
  const routes = files.flatMap((file) =>
    parseRoutes(readFileSync(path.join(ROUTES_DIR, file), "utf8")).map(
      (route) => ({ ...route, file })
    )
  );

  it("found the route files", () => {
    // Guards against a parser change quietly matching nothing, which would make
    // every assertion below vacuously true.
    assert.ok(routes.length > 40, `only parsed ${routes.length} routes`);
  });

  for (const file of files) {
    const name = file.replace(/\.ts$/, "");

    const writes = routes.filter(
      (route) => route.file === file && WRITE_METHODS.has(route.method)
    );

    for (const route of writes) {
      // Skipped per-route rather than per-file, so one open-by-design route in a
      // file cannot quietly exempt the rest of it.
      if (OPEN_BY_DESIGN.has(file)) continue;

      it(`${name}: ${route.method.toUpperCase()} ${route.path} requires a session`, () => {
        assert.ok(
          route.guarded,
          `${file} registers ${route.method.toUpperCase()} ${route.path} with no ` +
            "`protect`, so anyone unauthenticated can reach it. Public reads are " +
            "fine; a write needs a session."
        );
      });

      if (!STAFF_ONLY_WRITES.has(file)) continue;

      it(`${name}: ${route.method.toUpperCase()} ${route.path} requires a role`, () => {
        assert.ok(
          route.role,
          `${file} registers ${route.method.toUpperCase()} ${route.path} behind ` +
            "`protect` but no `authorize(...)`, so any signed-in customer — not " +
            "just staff — could reach it."
        );
      });
    }
  }

  it("keeps catalogue reads public", () => {
    // The converse: gating these would break the storefront, which browses
    // products, categories and collections without a session.
    for (const file of ["categoriesRoutes.ts", "collectionsRoutes.ts", "productsRoutes.ts"]) {
      const reads = routes.filter(
        (route) => route.file === file && route.method === "get"
      );
      assert.ok(reads.length > 0, `no reads found in ${file}`);

      for (const route of reads) {
        assert.equal(
          route.guarded,
          false,
          `${file} guards GET ${route.path}, which would break the public storefront`
        );
      }
    }
  });

  it("would have caught the categories and collections hole", () => {
    // The regression this file exists for, stated explicitly: those routers had
    // no `protect` on any route. If someone removes the guards again, this is the
    // assertion that fails — and the two loops above fail too, naming the route.
    const holes = routes.filter(
      (route) =>
        (route.file === "categoriesRoutes.ts" ||
          route.file === "collectionsRoutes.ts") &&
        WRITE_METHODS.has(route.method) &&
        !route.guarded
    );

    assert.deepEqual(
      holes,
      [],
      "these write routes are reachable without a session: " +
        holes.map((h) => `${h.method.toUpperCase()} ${h.path}`).join(", ")
    );
  });
});
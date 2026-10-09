// tests/adminGuards.test.ts
// ==========================================
// Every backoffice screen declares who may open it.
//
// `href: null` in `app/admin/_layout.tsx` hides a tab; it does not unregister the
// route. A manager or a warehouse_staff member is already inside `/admin`, so a
// deep link still reaches any screen, which then fires a request the server
// answers with 403 and shows a raw error toast. `RequireCapability` is what stops
// the screen mounting at all.
//
// This walks the directory instead of trusting a list, so a new screen fails the
// test until somebody decides its guard. That is the point: this is the test that
// would have caught `transfers/warehouses.tsx`, which was linked to from the
// transfers tab — open to warehouse_staff — while the warehouses API is
// admin/manager only, and which had no guard at all.
//
// It also pins the mistake that is easiest to make here: the wrapper has to be
// the *default* export. Stripping `export default` and adding a plain wrapper
// leaves a file that exports nothing; `tsc` is silent about it because nothing
// imports a route by name, and expo-router renders an empty screen.
// ==========================================
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import {
  CAPABILITY_ROLES,
  STAFF_ROLES,
  can,
  type Capability,
} from "../constants/permissions";

const ADMIN_DIR = path.resolve(__dirname, "..", "app", "admin");

/**
 * Which capability each screen answers to. Hand-written, because the guard is
 * JSX and cannot be derived — but it is checked against the directory in both
 * directions, so nothing can be added or removed without this list agreeing.
 */
const SCREEN_CAPABILITY: Record<string, Capability> = {
  "announcements.tsx": "announcements",
  "inventory/index.tsx": "inventory.read",
  "inventory/movements.tsx": "inventory.read",
  "inventory/adjust.tsx": "inventory.adjust",
  "purchasing/index.tsx": "purchasing",
  "purchasing/new.tsx": "purchasing",
  "purchasing/[id].tsx": "purchasing",
  "purchasing/suppliers.tsx": "suppliers",
  "transfers/index.tsx": "transfers",
  "transfers/new.tsx": "transfers",
  "transfers/warehouses.tsx": "warehouses",
};

/** Every screen file under `app/admin`, as posix-style paths, layouts excluded. */
const screenFiles = (dir = ADMIN_DIR, prefix = ""): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return screenFiles(path.join(dir, entry.name), rel);
    if (!entry.name.endsWith(".tsx")) return [];
    if (entry.name === "_layout.tsx") return [];
    return [rel];
  });

const read = (rel: string) =>
  readFileSync(path.join(ADMIN_DIR, ...rel.split("/")), "utf8");

/**
 * A screen needs a guard when some staff role reaches the backoffice but not this
 * capability. If every staff role has it, a guard would be dead weight.
 */
const needsGuard = (capability: Capability) =>
  !STAFF_ROLES.every((role) => can(role, capability));

describe("backoffice screens", () => {
  const files = screenFiles();

  it("accounts for every screen in the directory", () => {
    const known = new Set(Object.keys(SCREEN_CAPABILITY));
    const unknown = files.filter((file) => !known.has(file));

    assert.deepEqual(
      unknown,
      [],
      `New screen(s) with no declared capability: ${unknown.join(", ")}. ` +
        "Add them to SCREEN_CAPABILITY, and guard them if not every staff role " +
        "has the capability."
    );
  });

  it("has no stale entries", () => {
    const present = new Set(files);
    const stale = Object.keys(SCREEN_CAPABILITY).filter((f) => !present.has(f));

    assert.deepEqual(
      stale,
      [],
      `SCREEN_CAPABILITY lists missing file(s): ${stale.join(", ")}`
    );
  });

  it("only names capabilities that exist", () => {
    for (const [file, capability] of Object.entries(SCREEN_CAPABILITY)) {
      assert.ok(
        capability in CAPABILITY_ROLES,
        `${file} names "${capability}", which is not a capability`
      );
    }
  });

  for (const [file, capability] of Object.entries(SCREEN_CAPABILITY)) {
    const source = read(file);

    if (needsGuard(capability)) {
      it(`${file} refuses a role without "${capability}"`, () => {
        assert.match(
          source,
          new RegExp(`<RequireCapability\\s+capability="${capability}"`),
          `${file} must wrap itself in <RequireCapability capability="${capability}">`
        );
      });

      it(`${file} makes the guard the default export`, () => {
        // The failure this catches: `export default function Screen()` becoming
        // `function Screen()` plus a plain wrapper, leaving no default export at
        // all. Typechecking does not notice a route that exports nothing.
        assert.match(
          source,
          /export default function \w*Route\(\)/,
          `${file} must default-export the wrapper, not the inner screen`
        );
        assert.equal(
          (source.match(/export default/g) ?? []).length,
          1,
          `${file} must have exactly one default export`
        );
      });
    } else {
      it(`${file} needs no guard, since every staff role has "${capability}"`, () => {
        assert.doesNotMatch(
          source,
          /RequireCapability/,
          `${file} is guarded, but every staff role has "${capability}" — the ` +
            "guard can never fire. Remove it, or narrow the capability."
        );
      });
    }
  }
});

describe("guard usefulness", () => {
  it("only guards capabilities that actually exclude a staff role", () => {
    // Guards exist because a staff role can be inside /admin without the
    // capability. If that stopped being true the wrappers would be decoration.
    const guarded = Object.entries(SCREEN_CAPABILITY).filter(([, cap]) =>
      needsGuard(cap)
    );

    assert.ok(
      guarded.length > 0,
      "no screen needs a guard, which cannot be right"
    );
  });

  it("covers the warehouse case that motivated the guard", () => {
    // warehouse_staff reaches the backoffice and the transfers tab, but the
    // warehouses API is admin/manager only. This is the concrete pair that was
    // reachable and 403ing.
    assert.equal(can("warehouse_staff", "transfers"), true);
    assert.equal(can("warehouse_staff", "warehouses"), false);
    assert.equal(needsGuard("warehouses"), true);
  });
});

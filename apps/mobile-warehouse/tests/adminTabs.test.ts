// tests/adminTabs.test.ts
// ==========================================
//   Which tabs each staff role is offered.
//
// The list used to be seven hand-written `<Tabs.Screen>` blocks in
// `app/admin/_layout.tsx`, so this question could only be answered by signing in
// as that role on a device. It is the question that was got wrong once already —
// the gate was `role !== "admin"`, so a manager could call every inventory
// endpoint successfully and never see one of them.
//
// The second thing this pins is that every tab still points at a route that
// exists. `name` is the only thing tying a tab to its screen, and expo-router
// registers a tab for any route file it finds: a name that no longer matches
// either shows a tab that opens nothing, or silently drops a screen from the bar.
// Both are the kind of mistake that ships, because nothing else fails.
// ==========================================
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { ADMIN_TABS, tabTitle, visibleTabNames } from "../constants/adminTabs";
import { STAFF_ROLES, can } from "../constants/permissions";
import type { UserRole } from "../constants/roles";

const ADMIN_DIR = path.resolve(__dirname, "..", "app", "admin");

describe("ADMIN_TABS", () => {
  it("names no route twice", () => {
    const names = ADMIN_TABS.map((tab) => tab.name);
    assert.equal(
      new Set(names).size,
      names.length,
      `duplicate tab name(s): ${names.join(", ")}`
    );
  });

  it("gives every tab a non-empty title", () => {
    for (const tab of ADMIN_TABS) {
      assert.ok(tab.title.trim().length > 0, `tab "${tab.name}" has no title`);
      assert.equal(tabTitle(tab.name), tab.title);
    }
  });

  it("points every tab at a route that exists", () => {
    // `name` is either `<name>.tsx` or `<name>/index.tsx` — expo-router's rule.
    for (const tab of ADMIN_TABS) {
      const route = existsSync(path.join(ADMIN_DIR, `${tab.name}.tsx`))
        ? `${tab.name}.tsx`
        : existsSync(path.join(ADMIN_DIR, tab.name, "index.tsx"))
          ? `${tab.name}/index.tsx`
          : null;

      assert.ok(
        route,
        `tab "${tab.name}" has no app/admin/${tab.name}.tsx or ${tab.name}/index.tsx`
      );
    }
  });

  it("gives every top-level screen a tab", () => {
    // The other direction: a screen with no tab is unreachable from the bar. This
    // is what would have happened when `transfers/warehouses.tsx` was added — it is
    // deliberately not a tab of its own, so it is reached from the transfers
    // screen, and that only stays true while this agrees.
    const tabbed = new Set<string>(ADMIN_TABS.map((tab) => tab.name));

    const untabbed = readdirSync(ADMIN_DIR, { withFileTypes: true })
      .filter((entry) => entry.name !== "_layout.tsx")
      .filter((entry) => entry.isDirectory() || entry.name.endsWith(".tsx"))
      .map((entry) => entry.name.replace(/\.tsx$/, ""))
      .filter((name) => !tabbed.has(name));

    assert.deepEqual(untabbed, [], `Screen(s) with no tab: ${untabbed.join(", ")}`);
  });

  it("keeps tab order as the bar order", () => {
    // Not cosmetic: the first tab is where a role lands, so an admin opening the
    // backoffice should arrive at the dashboard rather than the stock list.
    assert.equal(ADMIN_TABS[0].name, "inventory");
    assert.equal(ADMIN_TABS[0].title, "Stock");
  });
});

describe("visibleTabNames", () => {
  it("offers the warehouse app's complete operational bar", () => {
    assert.deepEqual(
      visibleTabNames("admin"),
      ADMIN_TABS.map((tab) => tab.name)
    );
  });

  it("does not offer manager-only purchasing tools in the warehouse app", () => {
    assert.deepEqual(visibleTabNames("manager"), [
      "inventory",
      "transfers",
    ]);
  });

  it("gives warehouse staff stock and transfers, and nothing else", () => {
    assert.deepEqual(visibleTabNames("warehouse_staff"), [
      "inventory",
      "transfers",
    ]);
  });

  it("shows a customer and a cashier nothing", () => {
    // `isStaff` keeps them out of `/admin` entirely; this is the second layer.
    assert.deepEqual(visibleTabNames("user"), []);
    assert.deepEqual(visibleTabNames("cashier"), []);
  });

  it("shows nobody anything until Clerk has resolved", () => {
    // `role` is null until Clerk loads. Returning [] here means the bar renders
    // empty for a frame rather than flashing the full admin bar at a signed-out
    // user — the layout waits for `isLoaded` before it renders at all, but this
    // is the guarantee that makes that safe.
    assert.deepEqual(visibleTabNames(null), []);
    assert.deepEqual(visibleTabNames(undefined), []);
  });

  it("never offers a tab that no staff role can reach", () => {
    // A tab gated to nobody is dead UI: it can never render, and it still takes
    // up a slot in the bar for whichever role it was written for.
    for (const tab of ADMIN_TABS) {
      const reachable = (STAFF_ROLES as readonly UserRole[]).some((role) =>
        can(role, tab.capability)
      );
      assert.ok(
        reachable,
        `tab "${tab.name}" (${tab.capability}) is offered to no staff role`
      );
    }
  });
describe("the tab bar in app/admin/_layout.tsx", () => {
  const source = readFileSync(path.join(ADMIN_DIR, "_layout.tsx"), "utf8");

  it("renders the tabs from the list rather than restating them", () => {
    // The whole point of extracting the list. If someone puts the seven
    // `<Tabs.Screen>` blocks back by hand the data goes stale silently: the list
    // keeps passing every test above while the bar stops matching it, which is
    // the exact shape of the bug this file was written for.
    assert.match(
      source,
      /ADMIN_TABS\.map\(/,
      "_layout.tsx must render {ADMIN_TABS.map(...)} — a hand-written tab list " +
        "cannot be checked by any test here"
    );
  });

  it("has one icon per tab", () => {
    // `TAB_ICON` is typed `Record<AdminTabName, IconName>`, so a missing icon is
    // already a compile error. This asserts the reverse — that an icon is not
    // left behind for a tab that no longer exists, which the type cannot catch.
    const declared = source.match(
      /const TAB_ICON:[\s\S]*?=\s*\{([\s\S]*?)\n\};/
    );
    assert.ok(declared, "could not find TAB_ICON in _layout.tsx");

    const keys = [...declared[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1]);
    assert.deepEqual(
      keys.sort(),
      ADMIN_TABS.map((tab) => tab.name).sort(),
      "TAB_ICON and ADMIN_TABS disagree — an icon for a tab that is gone, or a " +
        "tab with no icon"
    );
  });

  it("hides a tab with href: null rather than dropping the route", () => {
    // Dropping the `<Tabs.Screen>` does not unregister the route, it just
    // removes the tab, so the screen stays deep-linkable — which is what
    // `RequireCapability` on each screen is for.
    assert.match(
      source,
      /href:\s*can\([\s\S]*?\?\s*undefined\s*:\s*null/,
      "_layout.tsx must gate tabs with `href: can(...) ? undefined : null`"
    );
  });
});

  it("matches CAPABILITY_ROLES for every role", () => {
    // The point of extracting this: the answer is now derived from one table
    // rather than restated in JSX, so it cannot disagree with the gates.
    for (const role of STAFF_ROLES) {
      const expected = ADMIN_TABS.filter((tab) => can(role, tab.capability)).map(
        (tab) => tab.name
      );
      assert.deepEqual(visibleTabNames(role), expected);
    }
  });
});

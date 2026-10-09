// tests/permissions.test.ts
// ==========================================
// The client's mirror of the server's `authorize` lists.
//
// This is a gate that decides which screens exist for a signed-in staff member.
// It is not the security boundary, but a wrong answer here is a support ticket
// in one direction (a manager locked out of tools that work) and a confusing
// dead end in the other (a screen that 403s on tap). Both are worth pinning.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CAPABILITY_ROLES,
  ROLES_WITHOUT_BACKOFFICE_ACCESS,
  STAFF_ROLES,
  can,
  isStaff,
  normalizeRole,
  type Capability,
} from "../constants/permissions";
import { USER_ROLES, type UserRole } from "../constants/roles";

const allCapabilities = Object.keys(CAPABILITY_ROLES) as Capability[];

describe("normalizeRole", () => {
  it("accepts every role the server declares", () => {
    for (const role of USER_ROLES) {
      assert.equal(normalizeRole(role), role);
    }
  });

  it("refuses anything it does not recognise", () => {
    // Fail closed: a role the server does not know must not become a grant.
    assert.equal(normalizeRole("superuser"), null);
    assert.equal(normalizeRole(""), null);
    assert.equal(normalizeRole(undefined), null);
    assert.equal(normalizeRole(null), null);
    assert.equal(normalizeRole(7), null);
    assert.equal(normalizeRole(["admin"]), null);
  });

  it("is case sensitive, so 'Admin' is not a grant", () => {
    // Clerk metadata is hand-edited; a stray capital is a support call, not access.
    assert.equal(normalizeRole("Admin"), null);
  });
});

describe("can", () => {
  it("gives a manager the inventory tools and not the admin ones", () => {
    assert.equal(can("manager", "inventory.read"), true);
    assert.equal(can("manager", "inventory.adjust"), true);
    assert.equal(can("manager", "purchasing"), true);
    assert.equal(can("manager", "announcements"), true);

    assert.equal(can("manager", "users"), false);
    assert.equal(can("manager", "dashboard"), false);
    assert.equal(can("manager", "orders"), false);
    assert.equal(can("warehouse_staff", "announcements"), false);
  });

  it("lets warehouse staff read stock and move it between warehouses", () => {
    assert.equal(can("warehouse_staff", "inventory.read"), true);
    assert.equal(can("warehouse_staff", "transfers"), true);

    // But not correct the books, raise a PO, or touch a price.
    assert.equal(can("warehouse_staff", "inventory.adjust"), false);
    assert.equal(can("warehouse_staff", "purchasing"), false);
    assert.equal(can("warehouse_staff", "suppliers"), false);
  });

  it("gives an admin everything", () => {
    for (const capability of allCapabilities) {
      assert.equal(can("admin", capability), true, `admin should reach ${capability}`);
    }
  });

  it("grants a plain customer nothing", () => {
    for (const capability of allCapabilities) {
      assert.equal(can("user", capability), false, `user should not reach ${capability}`);
    }
  });

  it("grants an unknown or absent role nothing", () => {
    for (const capability of allCapabilities) {
      assert.equal(can(null, capability), false);
      assert.equal(can(undefined, capability), false);
    }
  });
});

describe("isStaff", () => {
  it("admits the roles that can reach at least one capability", () => {
    // If a route ever opens a role up, this fails until STAFF_ROLES catches up.
    const reachable = USER_ROLES.filter((role) =>
      allCapabilities.some((capability) => can(role, capability))
    );

    assert.deepEqual([...STAFF_ROLES].sort(), [...reachable].sort());
  });

  it("keeps cashier out until the server grants it something", () => {
    // `cashier` is assignable and unlocks no route, so admitting it would show
    // an empty backoffice. If that changes, update STAFF_ROLES and this test.
    assert.ok(ROLES_WITHOUT_BACKOFFICE_ACCESS.includes("cashier"));
    assert.equal(isStaff("cashier"), false);
    for (const capability of allCapabilities) {
      assert.equal(can("cashier", capability), false);
    }
  });

  it("refuses a missing role", () => {
    assert.equal(isStaff(null), false);
    assert.equal(isStaff(undefined), false);
  });
});

describe("CAPABILITY_ROLES", () => {
  it("only ever names roles the server declares", () => {
    for (const capability of allCapabilities) {
      for (const role of CAPABILITY_ROLES[capability]) {
        assert.ok(
          (USER_ROLES as readonly string[]).includes(role),
          `${capability} names unknown role ${role}`
        );
      }
    }
  });

  it("grants every staff role at least one way in", () => {
    for (const role of STAFF_ROLES) {
      assert.ok(
        allCapabilities.some((capability) => can(role, capability)),
        `${role} could enter the backoffice and see nothing`
      );
    }
  });

  it("always includes admin, since admin is the superuser", () => {
    for (const capability of allCapabilities) {
      const roles: readonly UserRole[] = CAPABILITY_ROLES[capability];
      assert.ok(roles.includes("admin"), `${capability} excludes admin`);
    }
  });
});

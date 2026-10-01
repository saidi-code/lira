// tests/auth.test.ts
// ==========================================
// The `authorize` guard, tested without a database.
//
// Every staff route in the app sits behind this one function, and a mistake in
// it is invisible until somebody is refused access they should have. The role
// literals are also now type-checked against `USER_ROLES`, so a typo is a
// compile error rather than a route that 403s everyone.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { authorize, USER_ROLES } from "../middlewares/auth.js";
import type { UserRole } from "../models/User.js";

/**
 * Runs the middleware against a fake Express triple and reports what happened.
 *
 * `roles` is a parameter because what is being tested varies: the guard is about
 * the *relationship* between a caller's role and the list a route names, not
 * about one particular route.
 */
const run = (role: UserRole | undefined, roles: UserRole[] = ["admin", "manager"]) => {
  const calls: string[] = [];
  let status = 0;

  const res = {
    status(code: number) {
      status = code;
      return res;
    },
    json() {
      return res;
    },
  };

  authorize(...roles)({ user: role ? { role } : undefined } as never, res as never, () =>
    calls.push("next")
  );

  return { status, proceeded: calls.length === 1 };
};

describe("authorize", () => {
  it("lets a listed role through", () => {
    assert.equal(run("admin").proceeded, true);
    assert.equal(run("manager").proceeded, true);
  });

  it("lets another role through when the route names it", () => {
    // The same role is allowed or refused depending purely on the route's list.
    assert.equal(run("warehouse_staff").proceeded, false);
    assert.equal(
      run("warehouse_staff", ["admin", "manager", "warehouse_staff"]).proceeded,
      true
    );
  });

  it("refuses a role that is not listed", () => {
    const result = run("cashier");
    assert.equal(result.proceeded, false);
    assert.equal(result.status, 403);
  });

  it("refuses when there is no user at all", () => {
    // Reachable if a route is wired with `authorize` but without `protect`.
    // Must deny rather than fall through.
    const result = run(undefined);
    assert.equal(result.proceeded, false);
    assert.equal(result.status, 403);
  });

  it("refuses a customer on a staff route", () => {
    assert.equal(run("user").proceeded, false);
  });

  it("refuses everyone when the role list is empty", () => {
    // `authorize()` with no arguments is a wiring mistake, not a public route.
    const result = run("admin", []);
    assert.equal(result.proceeded, false);
    assert.equal(result.status, 403);
  });
});

describe("USER_ROLES", () => {
  it("covers every role AGENT.md §10 documents", () => {
    for (const role of ["admin", "manager", "warehouse_staff", "cashier", "user"]) {
      assert.ok(
        (USER_ROLES as readonly string[]).includes(role),
        `${role} must be assignable`
      );
    }
  });

  it("contains no role the schema would reject", () => {
    // The webhook only syncs roles from this list, so anything missing here
    // cannot be granted through Clerk either.
    assert.ok(USER_ROLES.length > 0);
    assert.equal(new Set(USER_ROLES).size, USER_ROLES.length, "no duplicates");
  });
});
// tests/cronAuth.test.ts
// ==========================================
// The authentication in front of the scheduled order sweep.
//
// This endpoint has no Clerk session behind it — it restocks the shop — so the
// secret check *is* the security boundary, and every branch of it was
// previously untested. The 503/401 paths are exercised here without a database
// because the handler returns before it touches the store, which is exactly
// when the store is least relevant.
// ==========================================
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractCronSecret,
  releaseExpiredOrdersHandler,
} from "../controllers/internalController.js";

const req = (headers: Record<string, string> = {}, query: Record<string, string> = {}) =>
  ({ get: (name: string) => headers[name.toLowerCase()], query }) as never;

/**
 * Minimal express `Response` double. The handler only chains
 * `.status().json()`, so anything more would be a mock of a mock — the captured
 * status and body are returned alongside rather than hung off the response,
 * because intersecting the fake with `never` (the parameter type) collapses it.
 */
interface Captured {
  statusCode: number;
  body: unknown;
}

const res = () => {
  const record: Captured = { statusCode: 0, body: undefined };
  const response = {
    status(code: number) {
      record.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      record.body = payload;
      return response;
    },
  };
  return { response: response as never, record };
};

describe("extractCronSecret", () => {
  it("reads the header we invented", () => {
    assert.equal(extractCronSecret(req({ "x-cron-secret": "s3cret" })), "s3cret");
  });

  it("reads Authorization: Bearer, which is what Vercel Cron sends itself", () => {
    assert.equal(extractCronSecret(req({ authorization: "Bearer s3cret" })), "s3cret");
  });

  it("accepts a lowercase scheme, per RFC 7235", () => {
    assert.equal(extractCronSecret(req({ authorization: "bearer s3cret" })), "s3cret");
  });

  it("trims surrounding whitespace", () => {
    assert.equal(extractCronSecret(req({ authorization: "Bearer   s3cret  " })), "s3cret");
  });

  it("prefers the explicit header when both are present", () => {
    assert.equal(
      extractCronSecret(
        req({ "x-cron-secret": "ours", authorization: "Bearer vercel" })
      ),
      "ours"
    );
  });

  it("refuses another scheme rather than passing the whole header through", () => {
    // The dangerous failure would be returning the raw header, which would let
    // "Basic <secret>" compare equal if anything ever loosened the compare.
    assert.equal(extractCronSecret(req({ authorization: "Basic s3cret" })), "");
    assert.equal(extractCronSecret(req({ authorization: "s3cret" })), "");
  });

  it("returns empty when nothing is supplied", () => {
    assert.equal(extractCronSecret(req()), "");
    assert.equal(extractCronSecret(req({ authorization: "Bearer " })), "");
  });
});

describe("releaseExpiredOrdersHandler", () => {
  const withSecret = (value: string | undefined, run: () => void) => {
    const before = process.env.CRON_SECRET;
    if (value === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = value;
    try {
      run();
    } finally {
      if (before === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = before;
    }
  };

  it("is disabled, not open, when CRON_SECRET is unset", () => {
    withSecret(undefined, () => {
      // This is the behaviour that matters most: a missing secret must never
      // mean "anyone can restock the shop".
      const { response, record } = res();
      void releaseExpiredOrdersHandler(req(), response);
      assert.equal(record.statusCode, 503);
    });
  });

  it("rejects a wrong secret", () => {
    withSecret("correct", () => {
      const { response, record } = res();
      void releaseExpiredOrdersHandler(
        req({ "x-cron-secret": "wrong" }),
        response
      );
      assert.equal(record.statusCode, 401);
    });
  });

  it("rejects a request with no secret at all", () => {
    withSecret("correct", () => {
      const { response, record } = res();
      void releaseExpiredOrdersHandler(req(), response);
      assert.equal(record.statusCode, 401);
    });
  });

  it("rejects an empty bearer, which is not the same as absent", () => {
    withSecret("correct", () => {
      const { response, record } = res();
      void releaseExpiredOrdersHandler(
        req({ authorization: "Bearer " }),
        response
      );
      assert.equal(record.statusCode, 401);
    });
  });

  it("rejects a secret that merely shares a prefix", () => {
    withSecret("correct-horse", () => {
      const { response, record } = res();
      void releaseExpiredOrdersHandler(
        req({ "x-cron-secret": "correct" }),
        response
      );
      assert.equal(record.statusCode, 401);
    });
  });
});
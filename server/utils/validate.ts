// utils/validate.ts
// ==========================================
//   Input validation for request bodies.
//
// The API had none: controllers read `req.body` and compared it directly. That
// is not safe, because JavaScript's relational operators coerce rather than
// reject, and the coercion is invisible at the call site:
//
//     if (quantity <= 0) return badRequest();        // "abc" <= 0  -> false
//     if (product.stock < quantity) return badRequest(); // 5 < "abc" -> false
//
// A body of `{"quantity": "abc"}` satisfies both guards. Mongoose then casts it
// to NaN, and `NaN < 1` is false too, so `min: 1` does not catch it either — the
// cart keeps a NaN quantity. Everything here exists because that failure is
// invisible at the point where it happens.
//
// Deliberately hand-rolled rather than pulled in as a dependency, to match the
// other small utilities in this folder. Every failure throws `AppError` with a
// 400, which `middlewares/errorHandler` already maps — so a validation failure
// needs no local try/catch, and the message is written for the caller.
//
// The type checks are `typeof`-based and reject everything else, including
// numeric strings. The client already sends real numbers, and a value the API
// quietly accepts in two forms is a value that eventually arrives in one.
// ==========================================
import { AppError } from "../middlewares/errorHandler.js";

/**
 * The explicit type annotation is load-bearing.
 *
 * TypeScript only narrows a parameter after a call that returns `never` when the
 * callee is a function declaration, or a `const` carrying a type annotation. An
 * arrow function whose return type merely *is* `never` does not narrow, so
 * `value` stayed `unknown` and every use below it failed to compile.
 */
const fail: (field: string, expectation: string) => never = (
  field,
  expectation
) => {
  throw new AppError(`${field} ${expectation}`, { status: 400 });
};

const describeValue = (value: unknown): string =>
  value === null
    ? "null"
    : Array.isArray(value)
      ? "an array"
      : typeof value;

/**
 * A finite number. Rejects NaN and Infinity, which pass `typeof x === "number"`
 * and are exactly what the comparisons above silently swallow.
 */
export const asFiniteNumber = (
  value: unknown,
  field: string,
  { min, max }: { min?: number; max?: number } = {}
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(field, `must be a number (received ${describeValue(value)})`);
  }
  if (min !== undefined && value < min) fail(field, `must be at least ${min}`);
  if (max !== undefined && value > max) fail(field, `must be at most ${max}`);
  return value;
};

/**
 * A whole number.
 *
 * Fractions are rejected rather than rounded: a quantity of 1.5 is not a thing
 * anybody means, and silently rounding it hides a client bug that would
 * otherwise show up as a stock discrepancy.
 */
export const asInteger = (
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {}
): number => {
  const n = asFiniteNumber(value, field, options);
  if (!Number.isInteger(n)) fail(field, "must be a whole number");
  return n;
};

/**
 * A quantity: a whole number of at least 1.
 *
 * Zero and negatives are rejected here because for an *add* they are nonsense.
 * Callers that treat 0 as "remove this line" should use `asInteger` instead and
 * keep that decision where it belongs.
 */
export const asPositiveInteger = (
  value: unknown,
  field: string,
  { max }: { max?: number } = {}
): number => asInteger(value, field, { min: 1, max });

/**
 * A required string, trimmed.
 *
 * `maxLength` is a guard, not a nicety: these values go into Mongo documents, and
 * an unbounded string in a document is both a storage problem and a way to make
 * every read of that collection slow.
 */
export const asString = (
  value: unknown,
  field: string,
  { minLength = 1, maxLength = 500, trim = true } = {}
): string => {
  if (typeof value !== "string") {
    fail(field, `must be text (received ${describeValue(value)})`);
  }
  const out = trim ? value.trim() : value;
  if (out.length < minLength) {
    fail(field, minLength === 1 ? "is required" : `must be at least ${minLength} characters`);
  }
  if (out.length > maxLength) fail(field, `must be at most ${maxLength} characters`);
  return out;
};

/**
 * An optional string. `undefined` and `null` become `undefined`, so a caller can
 * treat "absent" and "explicitly null" the same way — which is how these fields
 * behave everywhere else in the codebase.
 *
 * An empty string is rejected rather than becoming `""`, because for an optional
 * field "not provided" and "provided but blank" are different inputs and only one
 * of them means something.
 */
export const asOptionalString = (
  value: unknown,
  field: string,
  options: { maxLength?: number; minLength?: number; trim?: boolean } = {}
): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return asString(value, field, { minLength: 0, ...options });
};

/** One of a fixed set. Rejects the rest instead of trusting the caller. */
export const asOneOf = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[]
): T => {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    fail(field, `must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
};

/** A Mongo ObjectId in string form. */
export const asObjectId = (value: unknown, field: string): string => {
  const raw = asString(value, field, { maxLength: 64 });
  if (!/^[a-f\d]{24}$/i.test(raw)) fail(field, "is not a valid id");
  return raw;
};
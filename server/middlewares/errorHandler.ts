// middlewares/errorHandler.ts
// ==========================================
//   One place that decides what a thrown error becomes on the wire.
//
// Every controller used to wrap itself in `try { … } catch (error: any) { …
// res.status(500).json({ message: error.message }) }`. Three problems, all of
// them visible in production rather than in tests:
//
//   1. **It leaked internals.** `error.message` from Mongoose carries the
//      collection name, the field path and sometimes part of the document —
//      `Product.stock validation failed: 3 is less than minimum 0`. Ten call
//      sites sent that straight to the client.
//   2. **A bad request became a 500.** A malformed ObjectId throws CastError, a
//      bad enum throws ValidationError, and both were reported as "Server error",
//      so a caller could not tell their own mistake from ours.
//   3. **A duplicate key became a 500** instead of a 409, so a client retrying a
//      create got the same opaque failure forever.
//
// The mapping lives in one pure function so it can be tested without a
// database. Controllers keep their own try/catch for now (AGENT.md "Known
// limits"); what this guarantees is that anything that *reaches* it — a
// `next(err)`, a rejected promise in a route with no catch, a 404 — is handled
// consistently, and that the mapping is one table rather than 61 hand-written
// `status(500)`s.
// ==========================================
import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";

/**
 * What the client is told, and the status it is told with.
 *
 * `expose` is the only thing that reaches the wire. `internal` is what gets
 * logged, and it is deliberately richer — that difference is the whole point,
 * since a developer needs the CastError detail and a customer must not have it.
 */
export interface NormalizedError {
  status: number;
  /** Safe to send to the client. Never contains a stack or a Mongo detail. */
  expose: string;
  /** For the log only. */
  internal: string;
}

const UNKNOWN = "Something went wrong. Please try again.";

/** The safe, loggable description of any thrown value. */
const describe = (error: unknown): string => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === "string") return `Non-Error thrown: ${error}`;
  try {
    return `Non-Error thrown: ${JSON.stringify(error)}`;
  } catch {
    // A circular or BigInt-bearing object: `JSON.stringify` itself throws, and
    // a logger that throws while handling an error loses the original one.
    return "Non-Error thrown (unserialisable)";
  }
};

/**
 * Maps a thrown value to a status and a client-safe message.
 *
 * Structural checks rather than `instanceof` for the duplicate-key case: a test
 * double or a second copy of the driver in `node_modules` fails `instanceof`
 * while still being the same error, which is exactly how production would
 * classify something differently from the suite.
 */
export const normalizeError = (error: unknown): NormalizedError => {
  const internal = describe(error);

  // An error a controller raised on purpose: written for a user.
  if (isAppError(error)) {
    return { status: error.status, expose: error.expose, internal };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return { status: 400, expose: firstValidationMessage(error), internal };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      status: 400,
      // Not just "invalid id": naming the field tells the caller which to fix.
      expose: `Invalid value for "${error.path}".`,
      internal,
    };
  }

  if (isDuplicateKeyError(error)) {
    return { status: 409, expose: "That already exists.", internal };
  }

  // A JSON body Express could not parse. Thrown by body-parser, not by us.
  if (error instanceof SyntaxError && "body" in error) {
    return { status: 400, expose: "Malformed JSON body.", internal };
  }

  if (isTimeout(error)) {
    return { status: 503, expose: "Service busy. Please retry shortly.", internal };
  }

  return { status: 500, expose: UNKNOWN, internal };
};

export interface AppErrorOptions {
  status?: number;
  /** Overrides the automatic client message. Use for the caller-facing text. */
  expose?: string;
  cause?: unknown;
}

/**
 * An error a controller means to surface. Anything thrown that is *not* one of
 * these is treated as a fault on our side: a 500 with no detail.
 */
export class AppError extends Error {
  readonly status: number;
  readonly expose: string;
  readonly cause?: unknown;

  constructor(message: string, { status = 400, expose, cause }: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.expose = expose ?? message;
    this.cause = cause;
    Error.captureStackTrace?.(this, AppError);
  }

  static notFound(message = "Not found.") {
    return new AppError(message, { status: 404 });
  }
}

const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError ||
  (typeof error === "object" &&
    error !== null &&
    (error as { name?: string }).name === "AppError" &&
    typeof (error as { status?: unknown }).status === "number" &&
    typeof (error as { expose?: unknown }).expose === "string");

/**
 * The first validation message, not the whole object.
 *
 * Mongoose's default `ValidationError.message` is a JSON blob of every failing
 * path: unreadable for a user, and a description of our schema.
 */
const firstValidationMessage = (error: mongoose.Error.ValidationError): string => {
  for (const details of Object.values(error.errors)) return details.message;
  return "That input is not valid.";
};

/** Driver-level duplicate key, which is not wrapped in a ValidationError. */
const isDuplicateKeyError = (error: unknown): boolean => {
  const e = error as { code?: unknown; keyPattern?: unknown } | null;
  return typeof e?.code === "number" && e.code === 11000 && !!e.keyPattern;
};

const isTimeout = (error: unknown): boolean => {
  const e = error as { code?: unknown } | null;
  return e?.code === "ETIMEDOUT" || e?.code === "ECONNRESET" || /timeout/i.test(String(e));
};
/**
 * Terminal handler. Must be registered last and must keep all four parameters —
 * Express identifies an error middleware by arity, so dropping `next` turns this
 * into an ordinary handler that never runs.
 */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const { status, expose, internal } = normalizeError(error);

  // 5xx is us: log what the client did not get. 4xx is the caller's mistake, so
  // one line is enough to make a misbehaving client findable without a stack.
  if (status >= 500) console.error(`[error] ${expose} <- ${internal}`);
  else console.warn(`[warn] ${status} ${expose} <- ${internal}`);

  // Headers already flushed (a streamed response that threw mid-body): the only
  // safe move is to stop. Calling res.status() here throws ERR_HTTP_HEADERS_SENT
  // inside the error handler, which is how one failure becomes two.
  if (res.headersSent) return;
  res.status(status).json({ success: false, message: expose });
};

/**
 * Unmatched route. Without this Express replies with its own HTML 404, so an API
 * client gets `text/html` where it expects JSON and `res.data.message` is
 * undefined — which is how a wrong base URL turns into "undefined is not a
 * function" three layers away.
 */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`,
  });
};
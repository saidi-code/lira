// utils/transaction.ts
import mongoose, { ClientSession } from "mongoose";

/**
 * A standalone `mongod` (what most local dev setups run) refuses multi-document
 * transactions with server error code 20 / `IllegalOperation`, while Atlas
 * replica sets and sharded clusters support them.
 */
const isUnsupportedTransactionError = (error: unknown): boolean => {
  const e = error as { code?: number; codeName?: string; message?: string };
  return (
    e?.code === 20 ||
    e?.codeName === "IllegalOperation" ||
    /transaction numbers are only allowed|does not support transactions|transactions are not supported/i.test(
      e?.message ?? ""
    )
  );
};

/**
 * Runs `work` inside a MongoDB transaction when the deployment supports one and
 * transparently re-runs it without a session when it does not.
 *
 * `work` receives an optional session that MUST be threaded into every query it
 * issues, so the transactional path stays atomic. Because the fallback has no
 * rollback, `work` must also be safe to re-run and must undo its own writes when
 * it fails — see `deductStock` / `restoreStock` in `OrderController`.
 */
export async function withOptionalTransaction<T>(
  work: (session?: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();

  try {
    let result: T | undefined;
    let fellBack = false;

    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
    } catch (error) {
      if (!isUnsupportedTransactionError(error)) throw error;
      fellBack = true;
    }

    if (!fellBack) return result as T;

    console.warn(
      "[transaction] MongoDB reported no transaction support (standalone server?) — running without one."
    );
    return work(undefined);
  } finally {
    await session.endSession();
  }
}

/** Query options that carry the session only when there is one. */
export const sessionOption = (session?: ClientSession) =>
  session ? { session } : {};

export default withOptionalTransaction;

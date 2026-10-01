// services/transferService.ts
// ==========================================
// MOVING STOCK BETWEEN WAREHOUSES
// ==========================================
// A transfer document records the *intent*; `inventoryService.transfer` records
// what actually happened. Both legs land together under a transaction, so a
// completed transfer can never be half-applied — which would strand stock in a
// warehouse nobody counts any more.
// ==========================================
import mongoose, { ClientSession } from "mongoose";
import Transfer, {
  TRANSFER_STATUSES,
  type TransferStatus,
} from "../models/Transfer.js";
import { transfer as ledgerTransfer } from "./inventoryService.js";
import {
  sessionOption,
  withOptionalTransaction,
} from "../utils/transaction.js";

export class TransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransferError";
  }
}

/**
 * Which status changes are allowed, and which of them move stock.
 *
 * `completed` is the only one that does: `in_transit` is a promise ("it left the
 * source") and cancelling moves nothing. Keeping that decision in one pure
 * function is what stops a status edit from silently creating or destroying stock.
 */
export type TransferTransition = "none" | "move" | "forbidden";

export const transitionFor = (
  from: TransferStatus,
  to: TransferStatus
): TransferTransition => {
  if (from === to) return "none";
  if (from === "completed" || from === "cancelled") return "forbidden";

  if (to === "cancelled") return "none"; // nothing has moved yet
  if (to === "in_transit") return "none"; // bookkeeping only
  if (to === "completed") return "move";

  return "forbidden";
};

/** Cancelling is only possible while nothing has moved. */
export const canCancel = (from: TransferStatus): boolean =>
  from === "draft" || from === "in_transit";

/**
 * Applies a status change, moving the stock when the transition says so.
 *
 * The status write is guarded on the *current* status so two clerks completing
 * the same transfer cannot both move the goods.
 */
export const applyTransferStatus = async (
  transferId: string,
  to: TransferStatus,
  userId?: mongoose.Types.ObjectId | null
): Promise<TransferStatus> => {
  const transfer = await Transfer.findById(transferId);
  if (!transfer) throw new TransferError("Transfer not found");

  const from = transfer.status as TransferStatus;
  const move = transitionFor(from, to);

  if (move === "forbidden") {
    throw new TransferError(`Cannot change a ${from} transfer to ${to}`);
  }

  if (move === "none") {
    await Transfer.updateOne(
      { _id: transfer._id },
      { $set: { status: to } },
      sessionOption(undefined)
    );
    return to;
  }

  const run = async (session?: ClientSession) => {
    // Both legs, or neither: `ledgerTransfer` is transactional where the
    // deployment allows it, so a failure here leaves no orphaned stock.
    await ledgerTransfer(
      transfer.fromWarehouse,
      transfer.toWarehouse,
      transfer.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        reference: transfer.reference,
        user: userId ?? null,
        note: `Transfer ${transfer.reference}`,
      }))
    );

    // Guarded on the status we read: a second completer finds nothing to update
    // and must not have moved the stock twice.
    const result = await Transfer.updateOne(
      { _id: transfer._id, status: { $in: ["draft", "in_transit"] } },
      { $set: { status: to } },
      sessionOption(session)
    );

    if (result.modifiedCount === 0) {
      throw new TransferError(
        "This transfer was completed by someone else — reload"
      );
    }
  };

  await withOptionalTransaction(run);
  return to;
};

export { TRANSFER_STATUSES };
export type { TransferStatus };
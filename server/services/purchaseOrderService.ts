// services/purchaseOrderService.ts
// ==========================================
// RECEIVING PURCHASE ORDERS
// ==========================================
// Receiving is the only thing that turns a purchase order into stock, so it is
// where the interesting mistakes live:
//
//   - over-receiving (inventory §11.5: receivedQty ≤ quantity)
//   - receiving the same units twice from two concurrent clerks
//   - marking a line received without moving any stock
//
// The rules below are pure and unit-tested; the service wires them to the ledger.
// ==========================================
import mongoose, { ClientSession } from "mongoose";
import PurchaseOrder, {
  PO_STATUSES,
  type PurchaseOrderStatus,
} from "../models/PurchaseOrder.js";
import { receive } from "./inventoryService.js";
import {
  sessionOption,
  withOptionalTransaction,
} from "../utils/transaction.js";

/** Raised when a receipt would break an invariant. */
export class ReceiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReceiveError";
  }
}

export interface ReceivableLine {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  receivedQty: number;
}

export interface ReceiptRequest {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

/** Units still outstanding on a line. */
export const remaining = (line: ReceivableLine): number =>
  line.quantity - line.receivedQty;

/**
 * Validates one line of a receipt against what is still outstanding.
 *
 * Throws rather than clamping: a clerk asking for 10 when 3 remain has a data
 * problem, and silently receiving 3 would hide it.
 */
export const applyReceipt = (
  line: ReceivableLine,
  requested: number
): number => {
  if (!Number.isInteger(requested) || requested <= 0) {
    throw new ReceiveError(
      `Receipt quantity for ${line.name} must be a positive whole number`
    );
  }

  const left = remaining(line);
  if (requested > left) {
    throw new ReceiveError(
      `Cannot receive ${requested} × ${line.name}: only ${left} outstanding`
    );
  }

  return line.receivedQty + requested;
};

/**
 * Status implied by the lines once a receipt is applied.
 *
 * `draft`/`ordered` are about what has been *sent*; receiving implies the order
 * was sent, so a draft that receives goods moves to `partially_received` rather
 * than staying a draft.
 */
export const statusAfterReceipt = (
  current: PurchaseOrderStatus,
  lines: ReceivableLine[]
): PurchaseOrderStatus => {
  const complete = lines.every((line) => remaining(line) <= 0);
  return complete ? "received" : "partially_received";
};

/** Terminal states accept no further receipt. */
export const acceptsReceipt = (status: PurchaseOrderStatus): boolean =>
  status !== "received" && status !== "cancelled";

/**
 * Builds the conditional query that makes a receipt safe under concurrency.
 *
 * `receivedQty: { $lte: quantity - n }` travels *into* the update, so a second
 * clerk receiving the same units loses the race instead of double-counting them.
 */
export const receiptGuard = (
  line: ReceivableLine,
  requested: number
): Record<string, unknown> => ({
  items: {
    $elemMatch: {
      product: line.product,
      receivedQty: { $lte: line.quantity - requested },
    },
  },
});

/** Builds a PO number, e.g. `PO-20260110-K3F9A`. */
export const purchaseOrderNumber = (now: Date = new Date()): string => {
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `PO-${datePart}-${random}`;
};

/**
 * Books goods into a warehouse against a purchase order.
 *
 * Order of operations matters: stock is moved first (through the ledger, so a
 * `in` movement is written), then the counters. If the counter update loses a
 * concurrency race, the transaction rolls the stock back too; without one, the
 * compensating `out` movement below puts the units back and the ledger still
 * explains itself.
 */
export const receivePurchaseOrder = async (
  purchaseOrderId: string,
  request: ReceiptRequest[],
  warehouseId: mongoose.Types.ObjectId,
  userId?: mongoose.Types.ObjectId | null
): Promise<{ received: number; status: PurchaseOrderStatus }> => {
  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) throw new ReceiveError("Purchase order not found");
  if (!acceptsReceipt(po.status as PurchaseOrderStatus)) {
    throw new ReceiveError(
      `Purchase order is ${po.status} and cannot receive more stock`
    );
  }

  // Validate everything up front — a half-applied receipt is worse than none.
  const lines = po.items as unknown as ReceivableLine[];
  const plan = request.map((line) => {
    const target = lines.find((item) => String(item.product) === String(line.product));
    if (!target) {
      throw new ReceiveError(
        `Product ${line.product} is not on this purchase order`
      );
    }
    return {
      line: target,
      product: target.product,
      name: target.name,
      quantity: applyReceipt(target, line.quantity),
      delta: line.quantity,
    };
  });

  if (!plan.length) throw new ReceiveError("Nothing to receive");

  let moved = 0;

  const apply = async (session?: ClientSession) => {
    moved = 0;

    // 1. The ledger. This is the source of truth for what arrived.
    await receive(
      plan.map((entry) => ({
        product: entry.product,
        quantity: entry.delta,
        reference: po.orderNumber ?? undefined,
        user: userId ?? null,
        note: `Purchase order ${po.orderNumber}`,
      })),
      warehouseId
    );

    // 2. The counters, each guarded so a concurrent clerk cannot double-receive.
    for (const entry of plan) {
      const result = await PurchaseOrder.updateOne(
        {
          _id: po._id,
          ...receiptGuard(entry.line, entry.delta),
        },
        { $inc: { "items.$.receivedQty": entry.delta } },
        sessionOption(session)
      );

      if (result.modifiedCount === 0) {
        throw new ReceiveError(
          `Someone else received ${entry.name} first — reload and try again`
        );
      }
      moved++;
    }

    // 3. Roll the status forward from the freshest state we have.
    const updated = await PurchaseOrder.findById(po._id).lean();
    const updatedLines = (updated?.items ?? []) as unknown as ReceivableLine[];
    const nextStatus = statusAfterReceipt(
      (updated?.status ?? po.status) as PurchaseOrderStatus,
      updatedLines
    );

    await PurchaseOrder.updateOne(
      { _id: po._id },
      {
        $set: {
          status: nextStatus,
          ...(nextStatus === "received" ? { receivedAt: new Date() } : {}),
        },
      },
      sessionOption(session)
    );

    return nextStatus;
  };

  try {
    const status = await withOptionalTransaction(apply);
    return { received: moved, status };
  } catch (error) {
    // No transaction: the stock landed but the counters did not. Undo the stock
    // so the two never disagree; the `out` movement records why.
    if (moved > 0) {
      const { applyMovement } = await import("./inventoryService.js");
      await Promise.all(
        plan.map((entry) =>
          applyMovement("out", {
            product: entry.product,
            warehouse: warehouseId,
            quantity: entry.delta,
            reference: po.orderNumber ?? undefined,
            note: "Purchase order receipt reverted",
          }).catch(() => undefined)
        )
      );
    }
    throw error;
  }
};

/** A PO may only be cancelled before anything has arrived. */
export const canCancelPurchaseOrder = (
  status: PurchaseOrderStatus,
  lines: ReceivableLine[]
): boolean =>
  acceptsReceipt(status) && lines.every((line) => line.receivedQty <= 0);

export { PO_STATUSES };
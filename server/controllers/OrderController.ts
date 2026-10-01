// controllers/orderController.ts
import { Request, Response } from "express";
import mongoose, { ClientSession } from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { computeTotals, roundMoney } from "../config/pricing.js";
import {
  sessionOption,
  withOptionalTransaction,
} from "../utils/transaction.js";
import {
  commitOrderStock,
  releaseForOrder,
  reserveForOrder,
  transitionFor,
} from "../services/orderStockService.js";
import { sendOrderInvoiceEmail } from "../services/invoiceEmailService.js";
import { resolveInvoiceRecipient } from "../services/resolveInvoiceRecipient.js";

// ==================== TYPES ====================
interface AuthUser {
  _id: mongoose.Types.ObjectId;
  clerkId?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

interface OrderItemInput {
  product: mongoose.Types.ObjectId | string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface ShippingAddressInput {
  type?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

interface CreateOrderBody {
  items: OrderItemInput[];
  shippingAddressId?: string;
  shippingAddress?: ShippingAddressInput;
  paymentMethod?: string;
  notes?: string;
  shippingCost?: number;
  tax?: number;
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface UpdateOrderStatusBody {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface OrderParams {
  id: string;
}

interface OrderQuery {
  page?: string;
  limit?: string;
  status?: string;
  paymentStatus?: string;
}

interface OrderItemDoc {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  subtotal: number;
}

// ==================== STOCK HELPERS ====================
class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`Not enough stock for ${productName}`);
    this.name = "InsufficientStockError";
  }
}

interface StockLine {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
}

// Stock is no longer moved here: `services/orderStockService.ts` owns the
// ledger writes and keeps `Product.stock` (availability) in step. The helpers
// below only exist to describe *what* must be moved and *when*, so the cancel and
// checkout paths read the same way as before.

const isDuplicateKeyError = (error: unknown): boolean =>
  (error as { code?: number })?.code === 11000;

/**
 * Replay guard. The client mints one key per checkout attempt and repeats it on
 * retry, so a double tap or a network retry can never create two orders.
 */
const readIdempotencyKey = (req: Request): string | null => {
  const raw = req.get("Idempotency-Key");
  const key = typeof raw === "string" ? raw.trim() : "";
  return key ? key.slice(0, 120) : null;
};

const toStockLines = (
  items: { product: mongoose.Types.ObjectId; name: string; quantity: number }[]
): StockLine[] =>
  items.map((item) => ({
    product: item.product,
    name: item.name,
    quantity: item.quantity,
  }));

/**
 * Statuses whose order still holds its units. Stock is deducted when the order is
 * placed, so anything not shipped yet has to give it back; `shipped`/`delivered`
 * sold the units and `cancelled` already returned them.
 *
 * Exported so the payment-expiry sweep asks the same question the cancel path
 * does, instead of repeating the list (services/orderLifecycleService.ts).
 */
export const STOCK_HELD_STATUSES = ["placed", "processing"];

type StockHeldStatus = (typeof STOCK_HELD_STATUSES)[number];

/**
 * True for orders whose units are still reserved by it (see STOCK_HELD_STATUSES).
 * It takes a plain string because callers read the status off a Mongo document,
 * where mongoose types it as `string` rather than the schema's enum union.
 */
const holdsStock = (orderStatus: string): orderStatus is StockHeldStatus =>
  (STOCK_HELD_STATUSES as readonly string[]).includes(orderStatus);

export { holdsStock };

/** Express generics: a route with no URL params, body or query of interest. */
type EmptyParams = Record<string, never>;

/** The parts of an order the cancel path touches. */
export interface CancellableOrder {
  _id: mongoose.Types.ObjectId;
  orderStatus: string;
  /**
   * Used as the ledger `reference` so a movement can be traced to its order.
   * Nullable because that is how the schema types it — `null` falls back to the
   * id in `runCancellation`.
   */
  orderNumber?: string | null;
  items: { product: mongoose.Types.ObjectId; name: string; quantity: number }[];
}

/**
 * Everything the cancel path touches in the database, injected into
 * `runCancellation` so its guards can be tested without a running MongoDB.
 */
export interface CancellationStore {
  /**
   * Flip the order to `cancelled` only if it still holds stock, and report the
   * status that was replaced. The status filter IS the claim: when two cancels
   * race, exactly one of them gets a document back, and therefore exactly one
   * restocks. Resolves to `null` when the order was not cancellable.
   */
  claimCancellation(
    order: CancellableOrder,
    extraSet: Record<string, string>,
    session?: ClientSession
  ): Promise<{ orderStatus: string } | null>;

  /** Put the given lines back on the shelf. */
  restoreStock(
    lines: StockLine[],
    session?: ClientSession,
    reference?: string
  ): Promise<void>;

  /** Undo a claim when there is no transaction to roll it back for us. */
  revertCancellation(
    orderId: mongoose.Types.ObjectId,
    previousStatus: string
  ): Promise<void>;
}

/** The real store: mongoose, against MongoDB. */
const orderStore: CancellationStore = {
  claimCancellation: async (order, extraSet, session) => {
    // `new: false` hands back the document as it was, i.e. the status that was
    // really replaced — the one a compensating rollback has to restore.
    const claimed = await Order.findOneAndUpdate(
      { _id: order._id, orderStatus: { $in: STOCK_HELD_STATUSES } },
      { $set: { orderStatus: "cancelled", ...extraSet } },
      { new: false, ...sessionOption(session) }
    );

    return claimed ? { orderStatus: claimed.orderStatus } : null;
  },

  restoreStock: (lines, session, reference) =>
    releaseForOrder(lines, reference ?? "cancel", session),

  revertCancellation: async (orderId, previousStatus) => {
    await Order.updateOne(
      { _id: orderId },
      { $set: { orderStatus: previousStatus } }
    );
  },
};

/**
 * The decision logic of a cancellation: claim the order, restock it, and on
 * failure undo the claim when there is no transaction that can do it for us.
 *
 * Kept separate from `cancelAndRestock` (which supplies the real store and the
 * session) so the guarantees below are unit-testable. Exported for tests only —
 * production code always goes through `cancelAndRestock`.
 *
 * Returns `false` when the order was not cancellable; throws if the stock could
 * not be returned.
 */
export const runCancellation = async (
  order: CancellableOrder,
  store: CancellationStore,
  extraSet: Record<string, string> = {},
  session?: ClientSession
): Promise<boolean> => {
  const claimed = await store.claimCancellation(order, extraSet, session);
  if (!claimed) return false;

  try {
    await store.restoreStock(
      toStockLines(order.items),
      session,
      order.orderNumber ?? String(order._id)
    );
  } catch (error) {
    // No session => no rollback, so undo our own status flip. With a session the
    // transaction aborts and takes the claim with it.
    if (!session) {
      await store
        .revertCancellation(order._id, claimed.orderStatus)
        .catch(() => undefined);
    }
    throw error;
  }

  return true;
};

/**
 * Marks an order cancelled and puts its units back, or does nothing.
 *
 * Every entry point that can end an order — the customer's cancel, the admin
 * status change, the admin delete, the payment-expiry sweep — goes through here,
 * because `order.orderStatus = "cancelled"; order.save()` silently loses the
 * stock that checkout reserved.
 *
 * Exported for `services/orderLifecycleService.ts`. It moves to `inventoryService`
 * when that lands (AGENT.md §9).
 */
export const cancelAndRestock = async (
  order: CancellableOrder,
  extraSet: Record<string, string> = {}
): Promise<boolean> =>
  withOptionalTransaction((session) =>
    runCancellation(order, orderStore, extraSet, session)
  );

// ==================== CREATE ORDER ====================
// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    // `shippingCost` / `tax` are deliberately NOT read from the body: totals are
    // recomputed server-side from the DB prices (config/pricing.ts).
    const { items, shippingAddressId, shippingAddress, paymentMethod, notes } =
      req.body as CreateOrderBody;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // ---------- Replay guard ----------
    const idempotencyKey = readIdempotencyKey(req);
    if (idempotencyKey) {
      const alreadyPlaced = await Order.findOne({
        idempotencyKey,
        user: req.user!._id,
      });
      if (alreadyPlaced) {
        return res.status(200).json({
          success: true,
          message: "Order already placed",
          data: alreadyPlaced,
        });
      }
    }

    // ---------- Resolve address ----------
    let addressDoc: any = null;
    if (shippingAddressId) {
      if (!mongoose.Types.ObjectId.isValid(shippingAddressId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipping address id",
        });
      }
      addressDoc = await Address.findOne({
        _id: shippingAddressId,
        user: req.user!._id,
      });
      if (!addressDoc) {
        return res.status(404).json({
          success: false,
          message: "Shipping address not found",
        });
      }
    } else if (shippingAddress) {
      addressDoc = shippingAddress;
    } else {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // ---------- Validate products ----------
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems: OrderItemDoc[] = [];

    for (const item of items) {
      const product = productMap.get(item.product?.toString());
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const quantity = Number(item.quantity) || 0;
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      if (typeof product.stock === "number" && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`,
        });
      }

      const price = product.price ?? 0;
      // Rounded here too: this is the figure printed on the invoice line.
      const itemSubtotal = roundMoney(price * quantity);

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0],
        price,
        quantity,
        size: item.size ?? null,
        color: item.color ?? null,
        subtotal: itemSubtotal,
      });
    }

    // ---------- Totals: computed here, never taken from the client ----------
    const totals = computeTotals(orderItems);
    const stockLines = toStockLines(orderItems);

    // ---------- Commit: write the order and reserve stock together ----------
    // Under a transaction both land or neither does. Without one (standalone
    // MongoDB has no transactions) the catch below removes the half-written order.
    //
    // The order is written *before* the hold so the ledger row can reference its
    // real order number — an audit trail that points at a placeholder is worse
    // than no trail. The availability guard still runs inside `reserveForOrder`,
    // so nothing about the oversell protection moved.
    const placeOrder = async (session?: ClientSession) => {
      const [created] = await Order.create(
        [
          {
            user: req.user!._id,
            items: orderItems,
            shippingAddress: {
              type: addressDoc.type ?? "Other",
              street: addressDoc.street,
              city: addressDoc.city,
              state: addressDoc.state,
              zipCode: addressDoc.zipCode,
              phoneNumber: addressDoc.phoneNumber,
            },
            paymentMethod: paymentMethod ?? "cash",
            paymentStatus: "pending",
            orderStatus: "placed",
            ...totals,
            notes,
            idempotencyKey: idempotencyKey ?? undefined,
          },
        ],
        sessionOption(session)
      );

      try {
        await reserveForOrder(
          stockLines,
          created.orderNumber ?? String(created._id),
          session
        );
      } catch (error) {
        // `reserveForOrder` unwinds its own holds; only the order row is left.
        if (!session) {
          await Order.deleteOne({ _id: created._id }).catch(() => undefined);
        }
        throw error;
      }

      return created;
    };

    let order: Awaited<ReturnType<typeof placeOrder>>;

    try {
      order = await withOptionalTransaction(placeOrder);
    } catch (error) {
      // Two retries raced with the same key: the unique index rejects the
      // loser, which is exactly the outcome we want — hand back the winner.
      if (idempotencyKey && isDuplicateKeyError(error)) {
        const existing = await Order.findOne({
          idempotencyKey,
          user: req.user!._id,
        });
        if (existing) {
          return res.status(200).json({
            success: true,
            message: "Order already placed",
            data: existing,
          });
        }
      }

      if (error instanceof InsufficientStockError) {
        return res
          .status(400)
          .json({ success: false, message: error.message });
      }

      throw error;
    }

    // Clear the stored cart now that the order is committed. Best-effort on
    // purpose: failing to empty a cart must not hide a successful order, and
    // the client invalidates its cart cache regardless.
    try {
      await Cart.findOneAndUpdate(
        { user: req.user!._id },
        { $set: { items: [], totalAmount: 0 } }
      );
    } catch (cartClearErr) {
      console.warn("Failed to clear cart after order:", cartClearErr);
    }

    // ---------- Send the invoice email ----------
    // Fire-and-forget: the order is already committed, so a slow or failing
    // Clerk lookup or SMTP call must never delay or fail the checkout
    // response. We respond first and let the work settle in the background.
    //
    // The recipient is resolved from Clerk (the auth source of truth) rather
    // than the local `users` doc, which is only a webhook-written cache and can
    // hold a stale name/email if the customer changed it in Clerk.
    void (async () => {
      const recipient = await resolveInvoiceRecipient(
        req.user?.clerkId,
        { name: req.user?.name, email: req.user?.email }
      );

      await sendOrderInvoiceEmail(recipient, {
        orderNumber: order.orderNumber ?? "",
        items: orderItems.map((i) => ({
          name: i.name,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
          size: i.size,
          color: i.color,
          subtotal: i.subtotal,
        })),
        shippingAddress: {
          type: addressDoc.type ?? "Other",
          street: addressDoc.street,
          city: addressDoc.city,
          state: addressDoc.state,
          zipCode: addressDoc.zipCode,
          phoneNumber: addressDoc.phoneNumber,
        },
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt ?? new Date(),
      });
    })();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET MY ORDERS (PAGINATED) ====================
// @desc    Get logged-in user's orders (paginated)
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (
  req: AuthRequest & Request<EmptyParams, unknown, unknown, OrderQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = { user: req.user!._id };
    // Optional filter by status
    if (req.query.status) filter.orderStatus = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET ORDER BY ID ====================
// @desc    Get a single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderUser = order.user as unknown as {
      _id: mongoose.Types.ObjectId;
    };
    if (
      orderUser._id.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET ALL ORDERS (ADMIN, PAGINATED) ====================
// @desc    Get all orders (paginated)
// @route   GET /api/orders
// @access  Admin
export const getAllOrders = async (
  req: Request<EmptyParams, unknown, unknown, OrderQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { status, paymentStatus } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== UPDATE ORDER STATUS (ADMIN) ====================
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (
  req: AuthRequest & Request<OrderParams, unknown, UpdateOrderStatusBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ---------- Cancelling is not a plain field write ----------
    // "cancelled" also has to return the units checkout reserved, so it goes down
    // the same guarded path the customer's cancel uses instead of `order.save()`.
    if (orderStatus === "cancelled") {
      const didCancel = await cancelAndRestock(
        order,
        paymentStatus ? { paymentStatus } : {}
      );

      if (!didCancel) {
        return res.status(400).json({
          success: false,
          message:
            order.orderStatus === "cancelled"
              ? "Order is already cancelled"
              : "Cannot cancel an order that has been shipped or delivered",
        });
      }

      const cancelled = await Order.findById(order._id);

      return res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        data: cancelled ?? order,
      });
    }

    // A cancelled order's units are already back on the shelf, so moving it back
    // to an active status would leave it holding stock nobody reserved. Its
    // status is final — but payment bookkeeping (marking a refund) is still fine.
    if (order.orderStatus === "cancelled" && orderStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled orders cannot be reopened — place a new order instead. Send paymentStatus alone to record a refund.",
      });
    }

    // ---------- Fulfilment closes the ledger ----------
    // `placed → shipped` is where the units actually leave the shelf: the hold is
    // settled and `Inventory.quantity` finally drops. Without this the ledger
    // would only ever grow and reconcile would report drift forever.
    // `shipped → delivered` commits nothing (transitionFor says so), and a
    // cancelled order was already released, so this cannot double-count.
    const stockMove = transitionFor(order.orderStatus, orderStatus);

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    if (stockMove === "commit") {
      try {
        await commitOrderStock(
          toStockLines(order.items),
          order.orderNumber ?? String(order._id)
        );
      } catch (error) {
        // The order moved but the ledger did not. Report it rather than pretend:
        // `npm run reconcile` will show the difference until it is corrected.
        console.error(
          `Ledger commit failed for order ${order.orderNumber}:`,
          error
        );
        return res.status(500).json({
          success: false,
          message:
            "Order status updated, but stock could not be committed to the ledger — run `npm run reconcile`",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== CANCEL ORDER ====================
// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // ---------- Cancel + restock: the shared, guarded path ----------
    const didCancel = await cancelAndRestock(order);

    if (!didCancel) {
      return res.status(400).json({
        success: false,
        message:
          order.orderStatus === "cancelled"
            ? "Order is already cancelled"
            : "Cannot cancel an order that has been shipped or delivered",
      });
    }

    // Read it back after the commit so the client sees what is stored, not the
    // copy held before the flip.
    const cancelled = await Order.findById(order._id);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: cancelled ?? order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== DELETE ORDER (ADMIN) ====================
// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Admin
export const deleteOrder = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ---------- Never delete an order that still holds stock ----------
    // The `$inc` checkout performed has no other undo, so removing a
    // placed/processing order outright would strand its units for good. Cancel
    // first — which restocks through the shared path — then delete the record.
    // A `false` here means somebody else already cancelled (and restocked) it.
    if (holdsStock(order.orderStatus)) {
      await cancelAndRestock(order);
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
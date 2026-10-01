// controllers/purchaseOrderController.ts
// ==========================================
// Purchase orders (AGENT.md §12). Roles: admin, manager.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import PurchaseOrder, {
  type PurchaseOrderStatus,
} from "../models/PurchaseOrder.js";
import Product from "../models/Products.js";
import Warehouse from "../models/Warehouse.js";
import {
  canCancelPurchaseOrder,
  purchaseOrderNumber,
  receivePurchaseOrder,
  ReceiveError,
  type ReceivableLine,
} from "../services/purchaseOrderService.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

const fail = (message: string) => ({ success: false, message });

/** GET /purchase-orders */
export const listPurchaseOrders = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter: Record<string, unknown> = {};

    const supplier = req.query.supplier;
    const status = req.query.status;

    if (supplier !== undefined) {
      if (!isValidId(supplier)) return res.status(400).json(fail("Invalid supplier id"));
      filter.supplier = supplier;
    }
    if (typeof status === "string" && status) filter.status = status;

    const [rows, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .populate("supplier", "name contact")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch {
    return res.status(500).json(fail("Error fetching purchase orders"));
  }
};

/** GET /purchase-orders/:id */
export const getPurchaseOrder = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid purchase order id"));

    const order = await PurchaseOrder.findById(id)
      .populate("supplier", "name contact email phone")
      .lean();
    if (!order) return res.status(404).json(fail("Purchase order not found"));

    return res.status(200).json({ success: true, data: order });
  } catch {
    return res.status(500).json(fail("Error fetching purchase order"));
  }
};

type CreatePOBody = {
  supplier?: unknown;
  items?: unknown;
  shipping?: unknown;
  expectedAt?: unknown;
  notes?: unknown;
};

/**
 * POST /purchase-orders
 *
 * Product names are snapshotted from the database rather than trusted from the
 * body, the same rule `POST /orders` follows for prices.
 */
export const createPurchaseOrder = async (
  req: Request<Record<string, string>, unknown, CreatePOBody>,
  res: Response
): Promise<Response> => {
  try {
    const { supplier, items, shipping, expectedAt, notes } = req.body ?? {};

    if (!isValidId(supplier)) {
      return res.status(400).json(fail("A valid supplierId is required"));
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(fail("At least one line is required"));
    }

    const raw = items as {
      product?: unknown;
      quantity?: unknown;
      unitCost?: unknown;
    }[];

    const products = await Product.find({
      _id: { $in: raw.map((line) => String(line.product ?? "")) },
    });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = raw.map((line) => {
      const product = byId.get(String(line.product));
      if (!product) throw new ReceiveError(`Product not found: ${line.product}`);

      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ReceiveError(`Invalid quantity for ${product.name}`);
      }

      const unitCost = Number(line.unitCost);
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new ReceiveError(`Invalid unitCost for ${product.name}`);
      }

      return {
        product: product._id,
        name: product.name,
        quantity,
        unitCost,
        receivedQty: 0,
      };
    });

    const order = await PurchaseOrder.create({
      orderNumber: purchaseOrderNumber(),
      supplier,
      status: "draft",
      items: lines,
      shipping: Number(shipping) || 0,
      expectedAt: expectedAt ? new Date(String(expectedAt)) : null,
      notes: typeof notes === "string" ? notes : "",
    });

    return res
      .status(201)
      .json({ success: true, message: "Purchase order created", data: order });
  } catch (error) {
    const message =
      error instanceof ReceiveError
        ? error.message
        : "Error creating purchase order";
    return res.status(400).json(fail(message));
  }
};

type ReceiveBody = {
  warehouseId?: unknown;
  items?: { product?: unknown; quantity?: unknown }[];
};

/**
 * POST /purchase-orders/:id/receive
 *
 * The only route that turns a purchase order into stock. Partial receipts are
 * expected — a supplier splitting a shipment is normal, not an error.
 */
export const receiveStock = async (
  req: Request<Record<string, string>, unknown, ReceiveBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid purchase order id"));

    const { warehouseId, items } = req.body ?? {};
    if (!isValidId(warehouseId)) {
      return res.status(400).json(fail("A valid warehouseId is required"));
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(fail("Nothing to receive"));
    }

    const warehouse = await Warehouse.findById(warehouseId)
      .select("_id isActive")
      .lean();
    if (!warehouse) return res.status(404).json(fail("Warehouse not found"));
    if (!warehouse.isActive) {
      return res.status(400).json(fail("That warehouse is not active"));
    }

    const result = await receivePurchaseOrder(
      id,
      items.map((line) => ({
        product: line.product as mongoose.Types.ObjectId,
        quantity: Number(line.quantity),
      })),
      warehouse._id as mongoose.Types.ObjectId,
      req.user?._id ?? null
    );

    return res.status(200).json({
      success: true,
      message: `Received ${result.received} line(s)`,
      data: result,
    });
  } catch (error) {
    // Over-receiving is a caller mistake (409), not a server fault.
    if (error instanceof ReceiveError) {
      return res.status(409).json(fail(error.message));
    }
    return res.status(400).json(fail("Error receiving stock"));
  }
};

/** PUT /purchase-orders/:id/cancel — only while nothing has arrived. */
export const cancelPurchaseOrder = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid purchase order id"));

    const order = await PurchaseOrder.findById(id);
    if (!order) return res.status(404).json(fail("Purchase order not found"));

    const lines = order.items as unknown as ReceivableLine[];
    if (!canCancelPurchaseOrder(order.status as PurchaseOrderStatus, lines)) {
      return res.status(409).json(
        fail(
          "Cannot cancel a purchase order that is received, cancelled, or already has stock in"
        )
      );
    }

    order.status = "cancelled";
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Purchase order cancelled", data: order });
  } catch {
    return res.status(400).json(fail("Error cancelling purchase order"));
  }
};
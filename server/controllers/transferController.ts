// controllers/transferController.ts
// ==========================================
// Inter-warehouse transfers (AGENT.md §12).
// Roles: admin, manager, warehouse_staff — staff genuinely move boxes.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import Transfer from "../models/Transfer.js";
import Product from "../models/Products.js";
import Warehouse from "../models/Warehouse.js";
import {
  applyTransferStatus,
  TransferError,
  TRANSFER_STATUSES,
  type TransferStatus,
} from "../services/transferService.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

const fail = (message: string) => ({ success: false, message });

/** GET /transfers */
export const listTransfers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter: Record<string, unknown> = {};

    const status = req.query.status;
    const warehouse = req.query.warehouse;

    if (typeof status === "string" && status) filter.status = status;
    if (warehouse !== undefined) {
      if (!isValidId(warehouse)) return res.status(400).json(fail("Invalid warehouse id"));
      // A transfer touches a warehouse in either direction.
      filter.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
    }

    const [rows, total] = await Promise.all([
      Transfer.find(filter)
        .populate("fromWarehouse", "name code")
        .populate("toWarehouse", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transfer.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch {
    return res.status(500).json(fail("Error fetching transfers"));
  }
};

/** GET /transfers/:id */
export const getTransfer = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid transfer id"));

    const transfer = await Transfer.findById(id)
      .populate("fromWarehouse", "name code")
      .populate("toWarehouse", "name code")
      .lean();
    if (!transfer) return res.status(404).json(fail("Transfer not found"));

    return res.status(200).json({ success: true, data: transfer });
  } catch {
    return res.status(500).json(fail("Error fetching transfer"));
  }
};
type TransferBody = {
  fromWarehouse?: unknown;
  toWarehouse?: unknown;
  items?: unknown;
  notes?: unknown;
};

/** POST /transfers */
export const createTransfer = async (
  req: Request<Record<string, string>, unknown, TransferBody>,
  res: Response
): Promise<Response> => {
  try {
    const { fromWarehouse, toWarehouse, items, notes } = req.body ?? {};

    if (!isValidId(fromWarehouse) || !isValidId(toWarehouse)) {
      return res
        .status(400)
        .json(fail("fromWarehouse and toWarehouse are required"));
    }
    if (String(fromWarehouse) === String(toWarehouse)) {
      return res.status(400).json(fail("Source and destination must differ"));
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json(fail("At least one line is required"));
    }

    const [source, destination] = await Promise.all([
      Warehouse.findById(fromWarehouse).select("isActive").lean(),
      Warehouse.findById(toWarehouse).select("isActive").lean(),
    ]);

    if (!source || !destination) {
      return res.status(404).json(fail("Warehouse not found"));
    }
    if (!source.isActive || !destination.isActive) {
      return res.status(400).json(fail("Both warehouses must be active"));
    }

    const raw = items as { product?: unknown; quantity?: unknown }[];
    const products = await Product.find({
      _id: { $in: raw.map((line) => String(line.product ?? "")) },
    });
    const byId = new Map(products.map((p) => [String(p._id), p]));

    const lines = raw.map((line) => {
      const product = byId.get(String(line.product));
      if (!product) throw new TransferError(`Product not found: ${line.product}`);

      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new TransferError(`Invalid quantity for ${product.name}`);
      }

      return { product: product._id, name: product.name, quantity };
    });

    const transfer = await Transfer.create({
      reference: transferReference(String(fromWarehouse), String(toWarehouse)),
      fromWarehouse,
      toWarehouse,
      status: "draft",
      items: lines,
      notes: typeof notes === "string" ? notes : "",
      createdBy: req.user?._id ?? null,
    });

    return res
      .status(201)
      .json({ success: true, message: "Transfer created", data: transfer });
  } catch (error) {
    const message =
      error instanceof TransferError ? error.message : "Error creating transfer";
    return res.status(400).json(fail(message));
  }
};

/** PUT /transfers/:id/status — the only route that moves stock. */
export const updateTransferStatus = async (
  req: Request<Record<string, string>, unknown, { status?: unknown }>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid transfer id"));

    const status = req.body?.status;
    if (
      typeof status !== "string" ||
      !TRANSFER_STATUSES.includes(status as TransferStatus)
    ) {
      return res
        .status(400)
        .json(fail(`status must be one of: ${TRANSFER_STATUSES.join(", ")}`));
    }

    const updated = await applyTransferStatus(
      id,
      status as TransferStatus,
      req.user?._id ?? null
    );

    const transfer = await Transfer.findById(id).lean();
    return res.status(200).json({
      success: true,
      message: `Transfer is now ${updated}`,
      data: transfer,
    });
  } catch (error) {
    if (error instanceof TransferError) {
      return res.status(409).json(fail(error.message));
    }
    // Usually "not enough stock at the source".
    return res.status(400).json(fail("Error updating transfer"));
  }
};

/** Human reference, e.g. `TRF-a1b2-c3d4-X7K9P`. */
const transferReference = (fromId: string, toId: string): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `TRF-${fromId.slice(-4)}-${toId.slice(-4)}-${random}`;
};
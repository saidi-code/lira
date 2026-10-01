// controllers/inventoryController.ts
// ==========================================
// Stock levels and the movement ledger (AGENT.md §12).
// Roles: admin, manager, warehouse_staff.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import StockMovement from "../models/StockMovement.js";
import {
  adjust,
  getLowStock,
  InsufficientStockError,
} from "../services/inventoryService.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

const message = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

/** GET /inventory — stock levels, optionally filtered by warehouse. */
export const listInventory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const warehouse =
      typeof req.query.warehouse === "string" ? req.query.warehouse : undefined;

    if (warehouse && !isValidId(warehouse)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid warehouse id" });
    }

    const filter = warehouse ? { warehouse } : {};

    const [rows, total] = await Promise.all([
      Inventory.find(filter)
        .populate("product", "name price")
        .populate("warehouse", "name code")
        .skip(skip)
        .limit(limit)
        .lean(),
      Inventory.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: message(error, "Error fetching inventory") });
  }
};

/** GET /inventory/low-stock — at or below reorder level (§9). */
export const lowStock = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    return res.status(200).json({ success: true, data: await getLowStock() });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: message(error, "Error fetching low stock") });
  }
};

/** GET /inventory/movements — the audit trail, newest first. */
export const listMovements = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = {};
    const product = req.query.product;
    const warehouse = req.query.warehouse;
    const type = req.query.type;

    if (product !== undefined && !isValidId(product)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product id" });
    }
    if (warehouse !== undefined && !isValidId(warehouse)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid warehouse id" });
    }

    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    if (typeof type === "string" && type) filter.type = type;

    const [rows, total] = await Promise.all([
      StockMovement.find(filter)
        .populate("product", "name")
        .populate("warehouse", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: message(error, "Error fetching movements") });
  }
};

/** GET /inventory/:productId — what a customer can still buy. */
export const productAvailability = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { productId } = req.params;

    if (!isValidId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const rows = await Inventory.find({ product: productId })
      .populate("warehouse", "name code")
      .lean();

    const available = rows.reduce(
      (sum, row) => sum + (row.quantity - row.reserved),
      0
    );

    return res.status(200).json({
      success: true,
      data: { productId, available, warehouses: rows },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: message(error, "Error fetching availability"),
    });
  }
};

/** POST /inventory/adjust — manual correction, always explained. */
export const adjustStock = async (
  req: Request<
    Record<string, string>,
    unknown,
    {
      productId?: unknown;
      warehouseId?: unknown;
      quantity?: unknown;
      reason?: unknown;
    }
  >,
  res: Response
): Promise<Response> => {
  try {
    const { productId, warehouseId, quantity, reason } = req.body ?? {};

    if (!isValidId(productId) || !isValidId(warehouseId)) {
      return res.status(400).json({
        success: false,
        message: "productId and warehouseId are required",
      });
    }

    const delta = Number(quantity);
    if (!Number.isFinite(delta) || delta === 0) {
      return res
        .status(400)
        .json({ success: false, message: "quantity must be a non-zero number" });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "reason is required for an adjustment",
      });
    }

    // Routed through the service so the change is guarded *and* leaves a
    // StockMovement row — a manual edit that skips the ledger is exactly the
    // drift reconcileStock exists to catch.
    const result = await adjust({
      product: productId,
      warehouse: warehouseId,
      quantity: delta,
      reason,
      user: req.user?._id ?? null,
    });

    return res
      .status(200)
      .json({ success: true, message: "Stock adjusted", data: result });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res
      .status(400)
      .json({ success: false, message: message(error, "Could not adjust stock") });
  }
};
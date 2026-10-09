// controllers/warehouseController.ts
// ==========================================
// Warehouses (AGENT.md §12). Roles: admin, manager.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import Warehouse from "../models/Warehouse.js";
import Inventory from "../models/Inventory.js";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

/** GET /warehouses */
export const listWarehouses = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const warehouses = await Warehouse.find()
      .sort({ isDefault: -1, name: 1 })
      .lean();
    return res.status(200).json({ success: true, data: warehouses });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Error fetching warehouses",
    });
  }
};

/** GET /warehouses/choices — only the fields staff need to route a transfer. */
export const listWarehouseChoices = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  try {
    const warehouses = await Warehouse.find({ isActive: true })
      .select("name code isActive isDefault")
      .sort({ isDefault: -1, name: 1 })
      .lean();
    return res.status(200).json({ success: true, data: warehouses });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Error fetching warehouse choices",
    });
  }
};

/** GET /warehouses/:id — with a per-product stock summary. */
export const getWarehouse = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse id" });
    }

    const warehouse = await Warehouse.findById(id).lean();
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    const rows = await Inventory.find({ warehouse: id })
      .populate("product", "name price")
      .lean();

    const totalUnits = rows.reduce((sum, row) => sum + row.quantity, 0);
    const totalReserved = rows.reduce((sum, row) => sum + row.reserved, 0);

    return res.status(200).json({
      success: true,
      data: {
        ...warehouse,
        summary: {
          products: rows.length,
          totalUnits,
          totalReserved,
          available: totalUnits - totalReserved,
        },
        inventory: rows,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Error fetching warehouse",
    });
  }
};

/**
 * POST /warehouses/:id/default — make this the default.
 *
 * The incumbent is demoted in the same pass because the model hook refuses to let
 * two active defaults exist.
 */
export const setDefaultWarehouse = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: "Invalid warehouse id" });
    }

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    await Warehouse.updateMany(
      { _id: { $ne: warehouse._id }, isDefault: true },
      { $set: { isDefault: false } }
    );
    warehouse.isDefault = true;
    await warehouse.save();

    return res.status(200).json({
      success: true,
      message: "Default warehouse updated",
      data: warehouse,
    });
  } catch (error) {
    console.error("Error setting default warehouse:", error);
    return res.status(400).json({
      success: false,
      // The fallback, never `error.message`: a Mongoose ValidationError here
      // names the collection and the field, which is schema detail, not a
      // message for the caller.
      message: "Could not set default",
    });
  }
};

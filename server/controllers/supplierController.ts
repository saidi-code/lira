// controllers/supplierController.ts
// ==========================================
// Suppliers (AGENT.md §12). Roles: admin, manager.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

const isValidId = (id: unknown): id is string =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id);

const fail = (message: string) => ({ success: false, message });

/** GET /suppliers */
export const listSuppliers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter: Record<string, unknown> = {};

    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === "true";
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      // Regex rather than $text: the index is not built, and a supplier list is
      // small enough that a scan costs nothing.
      const safe = escapeRegex(req.query.search.trim());
      filter.name = { $regex: safe, $options: "i" };
    }

    const [rows, total] = await Promise.all([
      Supplier.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Supplier.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch {
    return res.status(500).json(fail("Error fetching suppliers"));
  }
};

/** GET /suppliers/:id */
export const getSupplier = async (
  req: Request<Record<string, string>>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid supplier id"));

    const supplier = await Supplier.findById(id)
      .populate("products", "name price")
      .lean();
    if (!supplier) return res.status(404).json(fail("Supplier not found"));

    return res.status(200).json({ success: true, data: supplier });
  } catch {
    return res.status(500).json(fail("Error fetching supplier"));
  }
};

type SupplierBody = {
  name?: unknown;
  contact?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  products?: unknown;
  isActive?: unknown;
};

/** POST /suppliers */
export const createSupplier = async (
  req: Request<Record<string, string>, unknown, SupplierBody>,
  res: Response
): Promise<Response> => {
  try {
    const { name, contact, email, phone, address, products } = req.body ?? {};

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json(fail("name is required"));
    }

    // Body values stay `unknown` until validated, so the create payload is built
    // explicitly rather than spread — a stray `isAdmin` must not reach the model.
    const payload: Record<string, unknown> = { name: name.trim() };
    if (contact !== undefined) payload.contact = contact;
    if (email !== undefined) payload.email = email;
    if (phone !== undefined) payload.phone = phone;
    if (address !== undefined) payload.address = address;

    if (products !== undefined) {
      if (!Array.isArray(products)) {
        return res.status(400).json(fail("products must be an array of ids"));
      }
      const bad = products.find((p) => !isValidId(p));
      if (bad) return res.status(400).json(fail(`Invalid product id: ${bad}`));
      payload.products = products;
    }

    const supplier = await Supplier.create(payload);

    return res
      .status(201)
      .json({ success: true, message: "Supplier created", data: supplier });
  } catch (error) {
    // The email `match` on the schema surfaces here.
    const message =
      error instanceof mongoose.Error.ValidationError
        ? Object.values(error.errors)[0]?.message ?? "Invalid supplier"
        : "Error creating supplier";
    return res.status(400).json(fail(message));
  }
};

/** PUT /suppliers/:id */
export const updateSupplier = async (
  req: Request<Record<string, string>, unknown, SupplierBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json(fail("Invalid supplier id"));

    const allowed: (keyof SupplierBody)[] = [
      "name",
      "contact",
      "email",
      "phone",
      "address",
      "products",
      "isActive",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) updates[key] = req.body[key];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json(fail("Nothing to update"));
    }

    const supplier = await Supplier.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!supplier) return res.status(404).json(fail("Supplier not found"));

    return res
      .status(200)
      .json({ success: true, message: "Supplier updated", data: supplier });
  } catch (error) {
    const message =
      error instanceof mongoose.Error.ValidationError
        ? Object.values(error.errors)[0]?.message ?? "Invalid supplier"
        : "Error updating supplier";
    return res.status(400).json(fail(message));
  }
};
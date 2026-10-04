// controllers/supplierController.ts
// ==========================================
// Suppliers (AGENT.md §12). Roles: admin, manager.
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";
import { asOptionalString, asString } from "../utils/validate.js";
import { AppError } from "../middlewares/errorHandler.js";

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
    const { products } = req.body ?? {};

    // Validated rather than a `!== undefined` pass-through. Every one of these is
    // a String in the schema with no maxlength, so an object became
    // "[object Object]" and an arbitrarily long string became a large document.
    // `address` is a nested object in the schema and must arrive as one.
    const body = req.body ?? {};
    const payload: Record<string, unknown> = {
      name: asString(body.name, "name", { maxLength: 200 }),
    };
    payload.contact = asOptionalString(body.contact, "contact", { maxLength: 200 }) ?? "";
    payload.email = asOptionalString(body.email, "email", { maxLength: 200 }) ?? "";
    payload.phone = asOptionalString(body.phone, "phone", { maxLength: 40 }) ?? "";

    if (body.address !== undefined) {
      const raw = body.address;
      if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
        throw new AppError("address must be an object", { status: 400 });
      }
      const a = raw as Record<string, unknown>;
      payload.address = {
        street: asOptionalString(a.street, "address.street", { maxLength: 300 }) ?? "",
        city: asOptionalString(a.city, "address.city", { maxLength: 100 }) ?? "",
        state: asOptionalString(a.state, "address.state", { maxLength: 100 }) ?? "",
        zipCode: asOptionalString(a.zipCode, "address.zipCode", { maxLength: 20 }) ?? "",
        country: asOptionalString(a.country, "address.country", { maxLength: 100 }) ?? "",
      };
    }

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
    // Re-thrown so the central handler keeps the 400 it carries. Without this
    // a validation failure is reported as a 500 — the caller's mistake presented
    // as a server fault. See utils/validate.ts.
    if (error instanceof AppError) throw error;

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
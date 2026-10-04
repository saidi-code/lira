import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Collection from '../models/Collections.js';
import { asObjectId, asString } from "../utils/validate.js";
import { AppError } from "../middlewares/errorHandler.js"; // adjust path

// ----------------------------------------
// CREATE a new collection
// ----------------------------------------
export const createCollection = async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};

    // Validated rather than truthiness-checked. `if (!title || !subtitle || …)` is
    // satisfied by an object, and Mongoose then stores "[object Object]" as the
    // collection title — which is rendered on the storefront. The old comment
    // here claimed "validation middleware also does this"; there is no such
    // middleware in this codebase, which is probably why the gap lasted.
    const title = asString(body.title, "title", { maxLength: 200 });
    const subtitle = asString(body.subtitle, "subtitle", { maxLength: 300 });
    const cta = asString(body.cta, "cta", { maxLength: 100 });
    const banner = asString(body.banner, "banner", { maxLength: 500 });

    // `products || []` accepted a bare string, which Mongoose then tried to cast
    // to an array of ids. Checked explicitly so the error names the field.
    const ids: string[] = [];
    if (body.products !== undefined) {
      if (!Array.isArray(body.products)) {
        throw new AppError("products must be an array of ids", { status: 400 });
      }
      for (const id of body.products) {
        ids.push(asObjectId(id, "products[]"));
      }
    }

    const newCollection = new Collection({
      title,
      subtitle,
      products: ids,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : false,
      cta,
      banner,
    });

    const saved = await newCollection.save();
    return res.status(201).json(saved);
  } catch (error) {
    // Re-thrown so the central handler keeps the 400 it carries; otherwise a
    // validation failure is reported as a 500. See utils/validate.ts.
    if (error instanceof AppError) throw error;

    console.error('Create collection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ----------------------------------------
// READ all collections (with pagination & population)
// ----------------------------------------
export const getCollections = async (req: Request, res: Response) => {
  try {
    // Pagination (optional)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filter by active/featured if provided
    const filter: any = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.isFeatured !== undefined) {
      filter.isFeatured = req.query.isFeatured === 'true';
    }

    const [collections, total] = await Promise.all([
      Collection.find(filter)
        .populate({ path: 'products', populate: { path: 'category', select: 'title icon' } })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Collection.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: collections,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get collections error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ----------------------------------------
// READ a single collection by ID
// ----------------------------------------
export const getCollectionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const collection = await Collection.findById(id)
      .populate({ path: 'products', populate: { path: 'category', select: 'title icon' } })
      .lean();

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.status(200).json(collection);
  } catch (error) {
    console.error('Get collection by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ----------------------------------------
// UPDATE a collection by ID
// ----------------------------------------
export const updateCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    // Prevent updating immutable fields if any (optional)
    const allowedUpdates = ['title', 'subtitle', 'products', 'isActive', 'isFeatured', 'cta', 'banner'];
    const updates = Object.keys(updateData);
    const isValidOperation = updates.every((key) => allowedUpdates.includes(key));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid update fields' });
    }

    const updated = await Collection.findByIdAndUpdate(id, updateData, {
      new: true, // return updated document
      runValidators: true, // enforce schema validation
    }).populate({ path: 'products', populate: { path: 'category', select: 'title icon' } });

    if (!updated) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update collection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// ----------------------------------------
// DELETE a collection by ID
// ----------------------------------------
export const deleteCollection = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid collection ID' });
    }

    const deleted = await Collection.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    return res.status(200).json({ message: 'Collection deleted successfully', deleted });
  } catch (error) {
    console.error('Delete collection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
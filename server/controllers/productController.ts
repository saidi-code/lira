import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Products.js";
import Category from "../models/Categories.js";
import cloudinary from "../config/cloundinary.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { asFiniteNumber, asInteger, asString } from "../utils/validate.js";
import { applyMovement, getDefaultWarehouse } from "../services/inventoryService.js";
import SkuInventory from "../models/SkuInventory.js";

export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const { category } = req.query;

    const query: any = { isActive: true };

    if (category && typeof category === 'string' && category.trim() && category !== 'الكل') {
      const trimmedCategory = category.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedCategory)) {
        query.category = trimmedCategory;
      } else {
        const categoryDoc = await Category.findOne({
          title: { $regex: new RegExp(`^${trimmedCategory}$`, 'i') },
        }).select('_id').lean();

        if (categoryDoc) {
          query.category = categoryDoc._id;
        } else {
          return res.json({
            success: true,
            data: [],
            pagination: { total: 0, page, pages: 0 },
          });
        }
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('category', 'title icon')
        .lean(),
      Product.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching products',
    });
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      category,
      minPrice,
      maxPrice,
      brand,
      color,
      size, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter: any = { isActive: true };

   
  // Text search — matches q anywhere in name, subtitle, or description
    if (q && typeof q === "string" && q.trim()) {
      const escaped = escapeRegex(q.trim());
      const regex = new RegExp(escaped, "i"); // "i" = case-insensitive
      filter.$or = [
        { name: { $regex: regex } },
        { subtitle: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }


    // Category filter
    if (category && typeof category === 'string' && category.trim() && category !== 'الكل') {
      const trimmedCategory = category.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedCategory)) {
        filter.category = trimmedCategory;
      } else {
        const categoryDoc = await Category.findOne({
          title: { $regex: new RegExp(`^${escapeRegex(trimmedCategory)}$`, 'i') },
        }).select('_id').lean();

        if (categoryDoc) {
          filter.category = categoryDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            data: [],
            pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 },
          });
        }
      }
    }
//brand filter
    if (brand && typeof brand === 'string' && brand.trim() && brand !== 'الكل') {
      filter.brand = { $regex: new RegExp(`^${escapeRegex(brand.trim())}$`, 'i') };
    }
//color filter
if (color && typeof color === 'string' && color.trim()) {
  const escaped = escapeRegex(color.trim());
  filter['colors.hex'] = { $regex: `^${escaped}$`, $options: 'i' };
}
    //size filter
    if (size && typeof size === 'string' && size.trim()) {
      filter.sizes = { $regex: new RegExp(`^${escapeRegex(size.trim())}$`, 'i') };
    } 
    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sort: any = {};
    const sortField = (sortBy as string) || 'createdAt';
    const sortDirection = (sortOrder as string) === 'asc' ? 1 : -1;
    sort[sortField] = sortDirection;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'title icon')
        .skip(skip)
        .limit(limitNum)
        .sort(sort)
        .lean(),
      Product.countDocuments(filter),
    ]);
    console.log("url", req.originalUrl);
    console.log(filter, 'filter');

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findById(id)
      .populate('category', 'title icon')
      .lean();

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching product',
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    let images = transformStringToArray(req.body.images).filter((value) => typeof value === "string") as string[];
    const files = (req as any).files as unknown;
    if (Array.isArray(files) && files.length > 0) {
      images = [...images, ...(await uploadImages(files))];
    }
    const type = req.body.type as "simple" | "variable";
    if (type !== "simple" && type !== "variable") {
      return res.status(400).json({ success: false, message: "type must be simple or variable" });
    }

    const inputColors = transformStringToArray(req.body.colors ?? req.body.vcolors) as any[];
    const featureImage = String(req.body.featureImage ?? images[0] ?? "").trim();
    const colors = type === "variable" ? inputColors.map((color) => ({
      ...color,
      featureImage: String(color.featureImage ?? color.images?.[0] ?? "").trim(),
      images: Array.isArray(color.images) ? color.images : [],
      variants: (Array.isArray(color.variants) ? color.variants : []).map((variant: any) => ({
        ...variant,
        size: Array.isArray(variant.size) ? variant.size[0] : variant.size,
        sku: String(variant.sku ?? "").trim(),
        stock: Number(variant.stock ?? 0),
      })),
    })) : [];

    if (!featureImage && images.length === 0 && !colors.some((color) => color.featureImage || color.images.length)) {
      return res.status(400).json({ success: false, message: "A feature image or product image is required" });
    }
    if (type === "variable" && (!colors.length || colors.some((color) =>
      (!color.featureImage && !color.images.length) ||
      !color.variants.length ||
      color.variants.some((variant: any) => !variant.size || !variant.sku)
    ))) {
      return res.status(400).json({ success: false, message: "Each variable color needs an image and each size needs its own SKU" });
    }

    // Category may arrive as an ObjectId or a title (admin UI sends titles)
    let categoryId = req.body.category;
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      const categoryDoc = await Category.findOne({
        title: { $regex: new RegExp(`^${escapeRegex(categoryId)}$`, "i") },
      })
        .select("_id")
        .lean();
      if (!categoryDoc) {
        return res.json({ success: false, message: `Unknown category: ${categoryId}` });
      }
      categoryId = categoryDoc._id;
    }

    const simpleSku = String(req.body.sku ?? `SMP-${Date.now().toString(36).toUpperCase()}`).trim();
    const requestedStock = asInteger(req.body.stock ?? 0, "stock", { min: 0 });
    const productData: any = {
      ...req.body,
      category: categoryId,
      images,
      featureImage,
      type,
      sku: type === "simple" ? simpleSku : (req.body.sku || undefined),
      stock: 0,
      sizes: type === "simple" ? [] : [...new Set(colors.flatMap((color) => color.variants.map((variant: any) => String(variant.size))))],
      colors: type === "variable" ? colors : [],
    };
    const product = await Product.create(productData);

    const initialStock = type === "simple"
      ? [{ sku: simpleSku, quantity: requestedStock }]
      : colors.flatMap((color) => color.variants.map((variant: any) => ({ sku: variant.sku, quantity: asInteger(variant.stock, "variant stock", { min: 0 }) })));
    if (initialStock.some((entry) => entry.quantity > 0)) {
      const warehouse = await getDefaultWarehouse();
      for (const entry of initialStock) {
        await SkuInventory.updateOne(
          { product: product._id, sku: entry.sku, warehouse: warehouse._id },
          { $setOnInsert: { quantity: 0, reserved: 0, reorderLevel: 0, binLocation: "" } },
          { upsert: true }
        );
        if (entry.quantity > 0) {
          await applyMovement("in", {
            product: product._id,
            sku: entry.sku,
            warehouse: warehouse._id,
            quantity: entry.quantity,
            reference: "product-create",
            note: "Initial SKU inventory",
          });
        }
      }
    }

    return res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    return res
      .status(error?.name === "ValidationError" ? 400 : 500)
      .json({ success: false, message: error?.message ?? "Error creating product" });
  }
};


// utils fn

type UploadedFileLike = {
  buffer: Buffer;
};

const uploadImages = async (filesImage: unknown): Promise<string[]> => {
  try {
    if (!Array.isArray(filesImage) || filesImage.length === 0) return [];

    const uploadPromises = (filesImage as UploadedFileLike[]).map(
      (file) => {
        return new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: "ecommerce_app/products",
            },
            (error: any, result: any) => {
              if (error) return reject(error);
              resolve(result!.secure_url as string);
            }
          );

          uploadStream.end(file.buffer);
        });
      }
    );

    return await Promise.all(uploadPromises);
  } catch (error: any) {
    console.error("error upload image to cloudinary", error);
    throw error;
  }
};
const transformStringToArray = (data: any): any[] => {
  // Every branch below assigns, so an initial value would never be read.
  let jsonData: any[];

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      jsonData = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      jsonData = data
        .split(",")
        .map((s: string) => s.trim())
        .filter((s: string) => s !== "");
    }
  } else if (Array.isArray(data)) {
    jsonData = data;
  } else if (data == null) {
    jsonData = [];
  } else {
    jsonData = [data];
  }

  return jsonData;
};

// ==================== UPDATE PRODUCT ====================
// @desc    Update a product (admin) — fields + optional new images
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Scalar fields (only overwrite when provided)
    const { name, description, price, stock, category, isFeatured, sizes } = req.body;

    if (stock !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock must be changed through the SKU inventory adjustment endpoint",
      });
    }

    // Validated rather than `Number(...)`-cast. `Number(null)`, `Number("")`,
    // `Number([])` and `Number(false)` are all 0, so `{"stock": null}` silently
    // set a product's stock to zero, and `{"price": "abc"}` stored NaN. The
    // fields are optional, so each is only checked when actually present.
    if (name !== undefined) product.name = asString(name, "name", { maxLength: 200 });
    if (description !== undefined) {
      product.description = asString(description, "description", { maxLength: 5000 });
    }
    if (price !== undefined) product.price = asFiniteNumber(price, "price", { min: 0 });
    if (isFeatured !== undefined) {
      product.isFeatured = isFeatured === true || isFeatured === "true";
    }
    if (sizes !== undefined) {
      product.sizes = transformStringToArray(sizes) as string[];
    }

    // Category may arrive as an ObjectId or a title (admin UI sends titles)
    if (category !== undefined && category !== "undefined") {
      if (mongoose.Types.ObjectId.isValid(category)) {
        product.category = category as any;
      } else {
        const categoryDoc = await Category.findOne({
          title: { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") },
        })
          .select("_id")
          .lean();
        if (categoryDoc) {
          product.category = categoryDoc._id as any;
        }
        // Unknown title → keep current category instead of failing
      }
    }

    // Images: keep existing ones the client sent back + upload any new files
    const existingImages = transformStringToArray(req.body.existingImages) as string[];
    let newImages: string[] = [];
    const files = (req as any).files as unknown;
    if (Array.isArray(files) && files.length > 0) {
      newImages = await uploadImages(files);
    }

    const finalImages = [...existingImages, ...newImages];
    if (finalImages.length === 0) {
      return res.json({ success: false, message: "At least one image is required" });
    }
    product.images = finalImages;

    await product.save();

    return res.json({ success: true, message: "Product updated", data: product });
  } catch (error: any) {
    // Forwarded rather than answered here. A validation failure throws an
    // AppError carrying a 400, and a local `catch` would turn it into a 500 —
    // the caller's mistake reported as our fault. This also removes the last
    // `error: error?.message` in the file, a leak variant an earlier sweep
    // missed because it used optional chaining rather than an instanceof.
    next(error);
  }
};

// ==================== DELETE PRODUCT (SOFT) ====================
// @desc    Deactivate a product (admin) — soft delete keeps order history intact
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.isActive = false;
    await product.save();

    return res.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: "Error deleting product", error: error?.message });
  }
};



import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Products.js";
import Category from "../models/Categories.js";
import cloudinary from "../config/cloundinary.js";
import cache from '../utils/cache.js';

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
      error: error instanceof Error ? error.message : error,
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

    // Text search
    if (q && typeof q === 'string' && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { subtitle: searchRegex },
      ];
    }

    // Category filter
    if (category && typeof category === 'string' && category.trim() && category !== 'الكل') {
      const trimmedCategory = category.trim();
      if (mongoose.Types.ObjectId.isValid(trimmedCategory)) {
        filter.category = trimmedCategory;
      } else {
        const categoryDoc = await Category.findOne({
          title: { $regex: new RegExp(`^${trimmedCategory}$`, 'i') },
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
    if (brand && typeof brand === 'string' && brand.trim()) {
      filter.brand = { $regex: new RegExp(`^${brand.trim()}$`, 'i') };
    }
//color filter
if (color && typeof color === 'string' && color.trim()) {
  const trimmedColor = color.trim();
  const escaped = trimmedColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  filter.colors = { $regex: `^${escaped}$`, $options: 'i' };
}
    //size filter
    if (size && typeof size === 'string' && size.trim()) {
      filter.sizes = { $regex: new RegExp(`^${size.trim()}$`, 'i') };
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
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    let images: string[] = [];
    const files = (req as any).files as unknown;
    if (Array.isArray(files) && files.length > 0) {
      images = await uploadImages(files);
    }

    if (images.length === 0) {
      return res.json({ success: false, message: "At least one image is required" });
    }

    const type = req.body.type as "simple" | "variable";

    // sizes/colors can come as JSON-stringified arrays from form-data
    const sizes = transformStringToArray(req.body.sizes) as any[];
    const colors = transformStringToArray(req.body.colors) as any;

    // Build payload differently based on product type
    // Schema notes (models/Products.ts):
    // - simple/variable both have: sizes, images, colors, stock
    // - variable likely needs `vcolors` (array of { name, hex, images, variants[] })
    //   but schema does not enforce it, so we forward it if provided.
    const productData: any = {
      ...req.body,
      images,
      type,
      sizes: sizes ?? [],
    };

    if (type === "simple") {
      // simple: sizes/colors are plain arrays
      productData.colors = colors ?? [];
    } else {
      // variable: vcolors is array of objects.
      // Your schema stores `colors` as [String], and also has `vcolors: [{...Color}]`.
      // Prefer vcolors as source of truth.
      const vcolors = req.body.vcolors ? req.body.vcolors : undefined;
      if (vcolors) {
        productData.vcolors = vcolors;

        // Derive top-level colors and sizes from vcolors
        const derivedColors = (Array.isArray(vcolors) ? vcolors : [])
          .map((c: any) => c?.name)
          .filter(Boolean);
        const derivedSizes = (Array.isArray(vcolors) ? vcolors : [])
          .flatMap((c: any) => (c?.variants ? c.variants.map((v: any) => v.size) : []));

        productData.colors = derivedColors.length ? derivedColors : colors ?? [];
        productData.sizes = (derivedSizes.length ? derivedSizes : sizes ?? []).filter(Boolean);
      } else {
        // fallback if client only sent colors/sizes
        productData.colors = colors ?? [];
        productData.sizes = sizes ?? [];
      }
    }


    const product = await Product.create(productData);

    return res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    return res
      .status(500)
      .json({ success: false, message: "Error creating product", error });
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
  let jsonData: any[] = [];

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



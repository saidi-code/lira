import { Request, Response } from "express";
import Product from "../models/Products.js";
import cloudinary from "../config/cloundinary.js";

export const getProducts = async (req: Request, res: Response) => {
  let query = { isActive: true };
  try {
    const { page = 1, limit = 10 } = req.query;
   
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('category', 'title icon');
      
    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      message: "Error fetching products",
      error,
    });
  }
};


import { Request, Response } from "express";
import Product from "../models/Products.js";
import Category from "../models/Category.js"; // 👈 import Category model
import cloudinary from "../config/cloundinary.js";

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const {
      q,
      page = 1,
      limit = 10,
      category,           // This is a title, e.g. "مجوهرات"
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // ---------- Build the filter ----------
    const filter: any = {};

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

    // ---------- Category filter (convert title → ObjectId) ----------
    if (category && typeof category === 'string') {
      // Find the category document with this title (case‑insensitive)
      const categoryDoc = await Category.findOne({
        title: { $regex: new RegExp(`^${category.trim()}$`, 'i') }
      });

      if (categoryDoc) {
        filter.category = categoryDoc._id; // Use the ObjectId
      } else {
        // No category with that title → return empty results
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { total: 0, page: Number(page), limit: Number(limit), totalPages: 0 },
        });
      }
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ---------- Pagination ----------
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    // ---------- Sorting ----------
    const sort: any = {};
    const sortField = (sortBy as string) || 'createdAt';
    const sortDirection = (sortOrder as string) === 'asc' ? 1 : -1;
    sort[sortField] = sortDirection;

    // ---------- Execute query ----------
    const products = await Product.find(filter)
      .populate('category', 'title icon')
      .skip(skip)
      .limit(limitNum)
      .sort(sort);

    const total = await Product.countDocuments(filter);

    res.status(200).json({
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id).populate("category",'title icon');

    if (!product || !product.isActive) {
      return res.json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error("error fetching product by id", error);
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error,
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



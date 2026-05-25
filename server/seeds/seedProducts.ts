import "dotenv/config";
import mongoose from "mongoose";
import { PRODUCTS } from "../data/index.js";
import Product from "../models/Products.js";
import User from "../models/User.js";
const connectDB = async () => {
  let fullUri;
  const baseUri = process.env.MONGODB_URI_BASE || process.env.DB_URI;
  const dbName = process.env.DB_NAME;

  if (!baseUri || !dbName) {
    throw new Error(
      "Missing DB config. Set MONGODB_URI_BASE (or DB_URI) and DB_NAME in .env"
    );
  }

  const cleanBase = baseUri.replace(/\/[^/]*$/, "").replace(/\/+$/, "");
  fullUri = `${cleanBase}/${dbName}`;

  await mongoose.connect(fullUri);
  console.log("Connected to MongoDB");
};

const randomSubtitle = () => {
  const adjectives = ["فاخر", "مميز", "أنيق", "راقي", "حديث", "متألق"];
  const nouns = ["اختيار", "لمسة", "قطعة", "أسلوب", "إطلالة", "ستايل"];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = Math.floor(Math.random() * 1000);
  return `${a} ${n} ${suffix}`;
};

const normalizeProduct = (p: any) => {
  const type = p.type;

  // Fix schema enum/string/date issues coming from seed data
  const normalizeSubCategory = (v: any) => {
    if (v === "women") return "woman";
    if (v === "man") return "man";
    if (v === "kids") return "kids";
    return v;
  };

  const normalizeDate = (v: any) => {
    if (!v) return undefined;
    // Some seed values look like: 2026-05-02T21:45:27.922+00:0 (invalid timezone offset)
    // Replace trailing "+00:0" -> "+00:00"
    if (typeof v === "string") {
      const fixed = v.replace(/([+-]\d{2}:)\d$/, "$100");
      const fixed2 = fixed.replace(/([+-]\d{2}):([0-9])$/, "$1:0$2");
      const d = new Date(fixed2);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    return v instanceof Date ? v : v;
  };

  const base = {
    ...p,
    type,
    // schema: description/subtitle/brand/subCategory are required
    description: (p.description ?? "").trim?.() ? p.description : "بدون وصف",
    subtitle: (p.subtitle ?? "").trim?.() ? p.subtitle : randomSubtitle(),

    brand: (p.brand ?? "").trim?.() ? p.brand : "غير محدد",
    subCategory: normalizeSubCategory(p.subCategory) ?? "woman",
    images: p.images ?? [],
    sizes: p.sizes ?? undefined,
    isActive: p.isActive ?? true,
    isFeatured: p.isFeatured ?? false,
    createdAt: normalizeDate(p.createdAt),
    price: Number(p.price) || 0,
  };

  if (type === "variable") {
    // seed variable products use `colors` but schema stores full color subdocs under `vcolors`
    const productSizes = Array.isArray(p.sizes) ? p.sizes : [];
    const colors = Array.isArray(p.colors) ? p.colors : [];

    base.vcolors = colors.map((c: any) => {
      const colorName = c?.name ?? "color";
      const variants = Array.isArray(c?.variants) ? c.variants : [];

      return {
        ...c,
        variants: variants.map((v: any, idx: number) => {
          const resolvedSize =
            (v?.size ?? "").toString().trim() ||
            (v?.sise ?? "").toString().trim() ||
            productSizes[idx] ||
            productSizes[0] ||
            "default";

          const resolvedSku =
            (v?.sku ?? "").toString().trim() ||
            `SKU-${(p?.name ?? "product").toString().replace(/\s+/g, "-")}-${colorName}-${resolvedSize}-${idx}`;

          return {
            ...v,
            size: resolvedSize,
            sku: resolvedSku,
          };
        }),
      };
    });

    base.colors = colors.map((c: any) => c?.name).filter(Boolean);
    base.sizes = productSizes;
  } else {
    base.colors = p.colors ?? [];
    base.sizes = p.sizes ?? undefined;
  }

  return base;
};

export const seedProducts = async () => {
  await connectDB();

  // If Product schema uses timestamps + _id as string, we keep provided values.
  const ops = PRODUCTS.map((p) => normalizeProduct(p));

  // Upsert by _id when provided, otherwise insert.
  for (const product of ops) {
    if (product?._id) {
      await Product.updateOne({ _id: product._id }, product, { upsert: true });
    } else {
      await Product.create(product);
    }
  }
  console.log(`Seeded products: ${ops.length}`);

  // Idempotent admin user seed (avoid unique index duplicate errors)
  const clerkId = "user_1234567890";
  const email = "achraf.saidi03@gmail.com";

  await User.updateOne(
    { clerkId },
    {
      $set: {
        name: "Admin User",
        email,
        image: "https://avatars.githubusercontent.com/u/12345678?v=4",
        role: "admin",
      },
    },
    { upsert: true }
  );

  console.log("Admin user ensured (upsert by clerkId).");
};

// CLI entry
if (process.argv[1] && process.argv[1].includes("seedProducts")) {
  seedProducts()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}


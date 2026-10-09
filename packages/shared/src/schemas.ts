/**
 * Domain validation helpers and types across Lyra clients & server.
 * Pure schema validation functions compatible with all environments.
 */

export interface ProductCreateInput {
  name: string;
  subtitle?: string;
  sku?: string;
  type?: "simple" | "variable";
  featureImage?: string;
  price: number;
  cost?: number;
  stock?: number;
  category?: string;
  subCategory?: string;
  description?: string;
  images?: string[];
  sizes?: string[];
  colors?: {
    name: string;
    hex: string;
    featureImage?: string;
    images?: string[];
    variants?: { size: string; sku: string; stock?: number; isActive?: boolean }[];
  }[];
  isFeatured?: boolean;
  isActive?: boolean;
}

export function validateProductCreate(input: unknown): {
  success: boolean;
  errors?: Record<string, string>;
  data?: ProductCreateInput;
} {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") {
    return { success: false, errors: { _root: "Invalid payload" } };
  }
  const obj = input as Record<string, unknown>;

  if (typeof obj.name !== "string" || !obj.name.trim()) {
    errors.name = "Name is required";
  }
  if (typeof obj.price !== "number" || obj.price < 0 || !Number.isFinite(obj.price)) {
    errors.price = "Price must be a positive number";
  }
  if (obj.sku !== undefined && typeof obj.sku !== "string") {
    errors.sku = "SKU must be a string";
  }
  if (obj.stock !== undefined && (typeof obj.stock !== "number" || obj.stock < 0)) {
    errors.stock = "Stock must be a non-negative number";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: input as ProductCreateInput };
}

export interface OrderCreateInput {
  items: Array<{
    productId: string;
    quantity: number;
    size?: string | null;
    color?: string | null;
  }>;
  shippingAddressId?: string;
  paymentMethod: "cash" | "stripe";
}

export function validateOrderCreate(input: unknown): {
  success: boolean;
  errors?: Record<string, string>;
  data?: OrderCreateInput;
} {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") {
    return { success: false, errors: { _root: "Invalid payload" } };
  }
  const obj = input as Record<string, unknown>;

  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    errors.items = "Order must contain at least one item";
  } else {
    for (let i = 0; i < obj.items.length; i++) {
      const item = obj.items[i];
      if (!item || typeof item !== "object" || !item.productId || typeof item.quantity !== "number" || item.quantity <= 0) {
        errors[`items.${i}`] = "Each item must have a valid productId and positive quantity";
      }
    }
  }

  if (obj.paymentMethod !== "cash" && obj.paymentMethod !== "stripe") {
    errors.paymentMethod = "Payment method must be 'cash' or 'stripe'";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: input as OrderCreateInput };
}

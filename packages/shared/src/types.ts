export interface Product {
  _id: string;
  name: string;
  subtitle?: string;
  sku?: string;
  type?: "simple" | "variable";
  featureImage?: string;
  price: number;
  images?: string[];
  description?: string;
  sizes?: string[] | null;
  category?: string | { _id: string; title?: string; icon?: string };
  stock?: number;
  brand?: string;
  colors?: {
    name: string;
    hex: string;
    featureImage?: string;
    images?: string[];
    variants?: { size: string; sku: string; stock: number; isActive?: boolean }[];
  }[];
  isFeatured?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface Collection {
  _id: string;
  title: string;
  subtitle: string;
  products: Product[] | string[];
  isActive: boolean;
  isFeatured: boolean;
  cta: string;
  banner: string;
}

export interface Category {
  _id: string;
  title: string;
  icon?: string;
}

export interface PricingConfig {
  shippingCost: number;
  taxRate: number;
  freeShippingThreshold: number | null;
}

export const FALLBACK_PRICING: PricingConfig = {
  shippingCost: 7,
  taxRate: 0,
  freeShippingThreshold: null,
};

export interface ApiList<T> {
  success?: boolean;
  data?: T | T[];
  pagination?: {
    total: number;
    page: number;
    limit?: number;
    totalPages?: number;
    pages?: number;
  };
  message?: string;
}

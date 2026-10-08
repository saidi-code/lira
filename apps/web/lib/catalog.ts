import type { Collection, PricingConfig, Product } from "@lira/shared";
import { FALLBACK_PRICING } from "@lira/shared";
import { api, type Envelope } from "./api";

export const catalogApi = {
  products: async (params?: Record<string, string | number | undefined>) => {
    const q = params?.q ?? params?.search;
    const path = q ? "/products/search" : "/products";
    const query: Record<string, string | number | undefined> = { ...params };
    if (q !== undefined) query.q = q;
    delete query.search;
    const res = await api.get<Envelope<Product[]>>(path, { params: query });
    return {
      products: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination,
    };
  },
  product: async (id: string) => {
    const res = await api.get<Envelope<Product> | Product>(`/products/${id}`);
    if (res && typeof res === "object" && "data" in res) {
      return (res as Envelope<Product>).data ?? null;
    }
    return (res as Product) ?? null;
  },
  collections: async () => {
    const res = await api.get<{ data: Collection[] }>("/collections", {
      params: { isActive: "true", limit: 12 },
    });
    return res.data ?? [];
  },
  categories: async () => {
    const res = await api.get<{ data: { _id: string; title: string }[] }>(
      "/categories"
    );
    return res.data ?? [];
  },
  pricing: async (): Promise<PricingConfig> => {
    const res = await api.get<Envelope<PricingConfig>>("/pricing");
    return res.data ?? FALLBACK_PRICING;
  },
};

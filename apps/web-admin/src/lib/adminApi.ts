import { request, type Envelope } from "./api";
import type { Product } from "@lira/shared";

export const adminApi = {
  stats: (token?: string | null) =>
    request<Envelope<Record<string, unknown>>>("get", "/admin/stats", token),
  users: (token?: string | null, page = 1) =>
    request<Envelope<unknown[]>>("get", "/admin/users", token, undefined, {
      page,
      limit: 20,
    }),
  setRole: (id: string, role: string, token?: string | null) =>
    request("put", `/admin/users/${id}/role`, token, { role }),
  products: (token?: string | null) =>
    request<Envelope<Product[]>>("get", "/products", token, undefined, {
      limit: 50,
      page: 1,
    }),
  orders: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/orders", token, undefined, {
      page: 1,
      limit: 50,
    }),
  setOrderStatus: (id: string, orderStatus: string, token?: string | null) =>
    request("put", `/orders/${id}/status`, token, { orderStatus }),
  inventory: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/inventory", token, undefined, {
      page: 1,
      limit: 50,
    }),
  lowStock: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/inventory/low-stock", token),
  movements: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/inventory/movements", token, undefined, {
      page: 1,
      limit: 40,
    }),
  adjust: (
    payload: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason: string;
    },
    token?: string | null
  ) => request("post", "/inventory/adjust", token, payload),
  warehouses: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/warehouses", token),
  setDefaultWarehouse: (id: string, token?: string | null) =>
    request("post", `/warehouses/${id}/default`, token, {}),
  suppliers: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/suppliers", token),
  purchaseOrders: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/purchase-orders", token),
  receivePo: (
    id: string,
    payload: { warehouseId: string; items: { productId: string; quantity: number }[] },
    token?: string | null
  ) => request("post", `/purchase-orders/${id}/receive`, token, payload),
  transfers: (token?: string | null) =>
    request<Envelope<unknown[]>>("get", "/transfers", token),
  setTransferStatus: (id: string, status: string, token?: string | null) =>
    request("put", `/transfers/${id}/status`, token, { status }),
};

export const asList = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: unknown[] }).data as T[];
  }
  return [];
};

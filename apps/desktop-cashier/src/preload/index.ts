import { contextBridge, ipcRenderer } from "electron";

/**
 * IPC bridge (spec §5 `src/preload/`). The renderer never talks to hardware
 * or node APIs directly — everything crosses through `window.api`.
 *
 * Types are declared locally because `@lira/shared` has no cart/printer types;
 * `src/renderer/src/bridge.d.ts` mirrors this surface for the React side.
 */

/** API base — server/.env sets PORT=3000 (see server/server.ts). */
const API_BASE = process.env.CASHIER_API_URL || "http://localhost:3000/api/v1";
/** Spec §8: `X-Client-Id: desktop-cashier` on every backend call. */
const CLIENT_ID = "desktop-cashier";

export interface CartLine {
  productId: string;
  name?: string;
  sku?: string;
  quantity: number;
  price: number;
}

export interface PrinterStatus {
  model: string;
  status: "ready" | "offline";
  driver: "electron-pos-printer" | "text-fallback";
}

export interface CashierOrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

export interface ShopProduct {
  _id: string;
  name: string;
  subtitle?: string;
  price: number;
  sku?: string;
  stock?: number;
  images?: string[];
  brand?: string;
}

export interface ProductSearchResult {
  success: boolean;
  data: ShopProduct[];
  pagination?: { total: number; page: number; pages?: number; totalPages?: number };
}

let bearerToken: string | null = null;

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-Id": CLIENT_ID,
    ...extra,
  };
  if (bearerToken) h["Authorization"] = `Bearer ${bearerToken}`;
  return h;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: headers((init.headers as Record<string, string>) || {}),
    // No `credentials`: auth is the Bearer JWT (spec §8), and the server's
    // cors() default (origin: '*') doesn't send Allow-Credentials — sending
    // credentials cross-origin would make the browser reject every response.
    credentials: "omit",
  });
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status}`);
  return (await res.json()) as T;
}

const api = {
  /** Clerk session JWT for `protect` middleware (spec §8 auth row). */
  setToken(token: string | null): void {
    bearerToken = token;
  },

  /**
   * Product catalogue (public endpoints — no auth needed).
   * Test mode: replaces the QR/scanner lookup until hardware exists.
   */
  searchProducts: (q: string, limit = 10) =>
    request<ProductSearchResult>(`/products/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  listProducts: (limit = 20) => request<ProductSearchResult>(`/products?limit=${limit}`),

  getProductById: (id: string) =>
    request<{ success: boolean; data: ShopProduct }>(`/products/${encodeURIComponent(id)}`),

  getCart: () => request<{ success: boolean; data: { items: CartLine[] } }>("/cart"),

  addToCart: (productId: string, quantity = 1) =>
    request<{ success: boolean; data: { items: CartLine[] } }>("/cart/add", {
      method: "POST",
      body: JSON.stringify({ productId, quantity }),
    }),

  removeCartItem: (productId: string) =>
    request<{ success: boolean; data: { items: CartLine[] } }>(`/cart/item/${productId}`, {
      method: "DELETE",
    }),

  clearCart: () =>
    request<{ success: boolean; data: { items: CartLine[] } }>("/cart", { method: "DELETE" }),

  /**
   * Spec §8 flow step 3 — `POST /orders` with an Idempotency-Key.
   * Backend shape: `{ success, message, data: <order> }`.
   * `shippingAddress` is an inline POS pickup object (no saved address needed).
   */
  placeOrder: (body: Record<string, unknown>, idempotencyKey: string) =>
    request<{ success: boolean; message?: string; data?: { _id: string; orderNumber?: string } }>(
      "/orders",
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(body),
      },
    ),

  /** Hardware status goes through IPC (main process), not fetch. */
  getPrinterStatus: (): Promise<PrinterStatus> => ipcRenderer.invoke("printer:get-status"),

  /** Spec §8 flow step 5 — main process prints the receipt. */
  printReceipt: (lines: string[]): Promise<{ cancelled: boolean; path?: string }> =>
    ipcRenderer.invoke("printer:print", lines),

  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
};

contextBridge.exposeInMainWorld("api", api);


/**
 * Renderer-side mirror of the preload bridge (`src/preload/index.ts`).
 * The preload exposes `window.api` via contextBridge; these types keep the
 * React side type-safe against that surface.
 */

interface CartLine {
  productId: string;
  product?: { _id?: string; name?: string; price?: number; images?: string[] } | string;
  name?: string;
  sku?: string;
  quantity: number;
  price: number;
}

interface ShopProduct {
  _id: string;
  name: string;
  subtitle?: string;
  price: number;
  sku?: string;
  stock?: number;
  images?: string[];
  brand?: string;
}

interface ProductSearchResult {
  success: boolean;
  data: ShopProduct[];
  pagination?: { total: number; page: number; pages?: number; totalPages?: number };
}

interface PlaceOrderResult {
  success: boolean;
  message?: string;
  data?: { _id: string; orderNumber?: string };
}

interface PrinterStatus {
  model: string;
  status: "ready" | "offline";
  driver: "electron-pos-printer" | "text-fallback";
}

interface CashierOrderResult {
  success: boolean;
  orderId?: string;
  message?: string;
}

interface CashierApi {
  setToken(token: string | null): void;
  searchProducts(q: string, limit?: number): Promise<ProductSearchResult>;
  listProducts(limit?: number): Promise<ProductSearchResult>;
  getProductById(id: string): Promise<{ success: boolean; data: ShopProduct }>;
  getCart(): Promise<{ success: boolean; data: { items: CartLine[] } }>;
  addToCart(productId: string, quantity?: number): Promise<{ success: boolean; data: { items: CartLine[] } }>;
  removeCartItem(productId: string): Promise<{ success: boolean; data: { items: CartLine[] } }>;
  clearCart(): Promise<{ success: boolean; data: { items: CartLine[] } }>;
  placeOrder(body: Record<string, unknown>, idempotencyKey: string): Promise<PlaceOrderResult>;
  getPrinterStatus(): Promise<PrinterStatus>;
  printReceipt(lines: string[]): Promise<{ cancelled: boolean; path?: string }>;
  versions: { node: string; electron: string; chrome: string };
}

interface Window {
  api: CashierApi;
}

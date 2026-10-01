// config/purchasingApi.ts
// ==========================================
// Suppliers, purchase orders and inter-warehouse transfers (server §12).
//
// Roles: suppliers and POs are admin/manager; transfers additionally admit
// warehouse_staff, who are the people actually moving boxes.
// ==========================================
import { api } from "./api";
import type { Pagination } from "./orderApi";
import type { BackendWarehouse } from "./inventoryApi";

export interface BackendSupplier {
  _id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: Record<string, string>;
  products?: string[];
  isActive: boolean;
  createdAt?: string;
}

/** Mirrors `PO_STATUSES` in `server/models/PurchaseOrder.ts`. */
export type PurchaseOrderStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export interface BackendPurchaseOrderItem {
  product: string | { _id: string; name: string };
  name: string;
  quantity: number;
  /** Invariant §11.5: never exceeds `quantity`. */
  receivedQty: number;
  unitCost: number;
}

export interface BackendPurchaseOrder {
  _id: string;
  orderNumber: string;
  supplier: string | { _id: string; name: string; contact?: string };
  status: PurchaseOrderStatus;
  items: BackendPurchaseOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  expectedAt?: string | null;
  receivedAt?: string | null;
  notes?: string;
  createdAt: string;
}

/** Mirrors `TRANSFER_STATUSES` in `server/models/Transfer.ts`. */
export type TransferStatus = "draft" | "in_transit" | "completed" | "cancelled";

export interface BackendTransferItem {
  product: string | { _id: string; name: string };
  name: string;
  quantity: number;
}

export interface BackendTransfer {
  _id: string;
  reference: string;
  fromWarehouse: string | BackendWarehouse;
  toWarehouse: string | BackendWarehouse;
  status: TransferStatus;
  items: BackendTransferItem[];
  notes?: string;
  createdBy?: string | null;
  createdAt: string;
}

export interface PurchasingResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T | T[];
  pagination?: Pagination;
}

export interface PurchaseOrderLineInput {
  productId: string;
  quantity: number;
  unitCost: number;
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

/** `data` is a single object or an array depending on the route. */
const unwrap = <T>(res: PurchasingResponse<T>): T[] =>
  Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];

export const purchasingApi = {
  // ---------------- Suppliers ----------------

  listSuppliers: async (
    params?: {
      active?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
    token?: string | null
  ): Promise<{ rows: BackendSupplier[]; pagination: Pagination }> => {
    const res = await api.get<PurchasingResponse<BackendSupplier>>("/suppliers", {
      params,
      headers: authHeaders(token),
    });
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  getSupplier: async (id: string, token?: string | null) => {
    const res = await api.get<PurchasingResponse<BackendSupplier>>(
      `/suppliers/${id}`,
      { headers: authHeaders(token) }
    );
    return Array.isArray(res.data) ? res.data[0] : res.data;
  },

  createSupplier: async (
    payload: {
      name: string;
      contact?: string;
      email?: string;
      phone?: string;
      address?: Record<string, string>;
    },
    token?: string | null
  ) => {
    const res = await api.post<PurchasingResponse<BackendSupplier>>(
      "/suppliers",
      payload,
      { headers: authHeaders(token) }
    );
    return res;
  },

  updateSupplier: async (
    id: string,
    payload: Partial<Omit<BackendSupplier, "_id">>,
    token?: string | null
  ) => {
    const res = await api.put<PurchasingResponse<BackendSupplier>>(
      `/suppliers/${id}`,
      payload,
      { headers: authHeaders(token) }
    );
    return res;
  },

  // ---------------- Purchase orders ----------------

  listPurchaseOrders: async (
    params?: {
      supplier?: string;
      status?: PurchaseOrderStatus;
      page?: number;
      limit?: number;
    },
    token?: string | null
  ): Promise<{ rows: BackendPurchaseOrder[]; pagination: Pagination }> => {
    const res = await api.get<PurchasingResponse<BackendPurchaseOrder>>(
      "/purchase-orders",
      { params, headers: authHeaders(token) }
    );
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  getPurchaseOrder: async (id: string, token?: string | null) => {
    const res = await api.get<PurchasingResponse<BackendPurchaseOrder>>(
      `/purchase-orders/${id}`,
      { headers: authHeaders(token) }
    );
    return Array.isArray(res.data) ? res.data[0] : res.data;
  },

  /**
   * POST /purchase-orders
   *
   * Product names are snapshotted server-side; `unitCost` is what the shop pays,
   * which the client is the only place that knows. The server rejects a negative
   * or non-integer quantity and an unknown product.
   */
  createPurchaseOrder: async (
    payload: {
      supplierId: string;
      items: PurchaseOrderLineInput[];
      shipping?: number;
      expectedAt?: string;
      notes?: string;
    },
    token?: string | null
  ) => {
    const res = await api.post<PurchasingResponse<BackendPurchaseOrder>>(
      "/purchase-orders",
      payload,
      { headers: authHeaders(token) }
    );
    return res;
  },

  /**
   * POST /purchase-orders/:id/receive
   *
   * The only call that turns a purchase order into stock. Partial receipts are
   * normal — a supplier splitting a shipment is not an error.
   *
   * 409 comes back when the receipt would exceed what was ordered, so a screen
   * should treat that as "some of this is wrong" and reload rather than retry.
   */
  receive: async (
    id: string,
    payload: {
      warehouseId: string;
      items: { productId: string; quantity: number }[];
    },
    token?: string | null
  ) => {
    const res = await api.post<PurchasingResponse<{ received: number }>>(
      `/purchase-orders/${id}/receive`,
      payload,
      { headers: authHeaders(token) }
    );
    return res;
  },

  /** PUT /purchase-orders/:id/cancel — 409 once any line has stock in. */
  cancelPurchaseOrder: async (id: string, token?: string | null) => {
    const res = await api.put<PurchasingResponse<BackendPurchaseOrder>>(
      `/purchase-orders/${id}/cancel`,
      undefined,
      { headers: authHeaders(token) }
    );
    return res;
  },

  // ---------------- Transfers ----------------

  listTransfers: async (
    params?: {
      status?: TransferStatus;
      warehouse?: string;
      page?: number;
      limit?: number;
    },
    token?: string | null
  ): Promise<{ rows: BackendTransfer[]; pagination: Pagination }> => {
    const res = await api.get<PurchasingResponse<BackendTransfer>>("/transfers", {
      params,
      headers: authHeaders(token),
    });
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  getTransfer: async (id: string, token?: string | null) => {
    const res = await api.get<PurchasingResponse<BackendTransfer>>(
      `/transfers/${id}`,
      { headers: authHeaders(token) }
    );
    return Array.isArray(res.data) ? res.data[0] : res.data;
  },

  createTransfer: async (
    payload: {
      fromWarehouseId: string;
      toWarehouseId: string;
      items: { productId: string; quantity: number }[];
      notes?: string;
    },
    token?: string | null
  ) => {
    const res = await api.post<PurchasingResponse<BackendTransfer>>(
      "/transfers",
      payload,
      { headers: authHeaders(token) }
    );
    return res;
  },

  /**
   * PUT /transfers/:id/status
   *
   * Only `completed` moves stock, and the server guards it on the current status
   * so a double-tap cannot move the goods twice. 409 means somebody else got
   * there first.
   */
  setTransferStatus: async (
    id: string,
    status: TransferStatus,
    token?: string | null
  ) => {
    const res = await api.put<PurchasingResponse<BackendTransfer>>(
      `/transfers/${id}/status`,
      { status },
      { headers: authHeaders(token) }
    );
    return res;
  },
};
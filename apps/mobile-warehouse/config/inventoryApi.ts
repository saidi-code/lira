// config/inventoryApi.ts
// ==========================================
// Stock levels, warehouses and the movement ledger.
//
// Roles (server §10): reads are open to warehouse_staff, adjustments to
// admin/manager. The client does not enforce that — `authorize` does — but the
// types carry the shape so a screen cannot quietly mis-read a response.
// ==========================================
import { api } from "./api";
import type { Pagination } from "./orderApi";

/**
 * Mirrors `MOVEMENT_TYPES` in `server/models/StockMovement.ts`.
 *
 * `commit` and the split `transfer_out` / `transfer_in` are not the same as an
 * older draft of this file: a `commit` settles a hold, while an `out` is stock
 * that was never held. Treating them as interchangeable is what caused phantom
 * reservations.
 */
export type MovementType =
  | "in"
  | "out"
  | "reserve"
  | "release"
  | "commit"
  | "transfer_out"
  | "transfer_in"
  | "adjust";

export interface BackendWarehouse {
  _id: string;
  name: string;
  code: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  isDefault: boolean;
}

export interface BackendInventoryRow {
  _id: string;
  product: string | { _id: string; name: string; sku?: string };
  warehouse: string | { _id: string; name: string; code?: string };
  quantity: number;
  reserved: number;
  /** Σ(quantity − reserved) — what a customer can actually buy. */
  available?: number;
  reorderLevel: number;
  binLocation?: string;
}

export interface BackendStockMovement {
  _id: string;
  product: string | { _id: string; name: string };
  warehouse: string | { _id: string; name: string };
  type: MovementType;
  /** Magnitude, always positive. */
  quantity: number;
  /** Signed effect on `Inventory.quantity` — direction, without reading `type`. */
  delta: number;
  reference?: string;
  user?: string | null;
  note?: string;
  createdAt: string;
}

export interface InventoryResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  data?: T | T[];
  pagination?: Pagination;
}

export interface MovementQueryParams {
  page?: number;
  limit?: number;
  product?: string;
  warehouse?: string;
  type?: MovementType;
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const unwrap = <T>(res: InventoryResponse<T>): T[] =>
  Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];

export const inventoryApi = {
  /** GET /inventory — `warehouse`, `page`, `limit`. */
  list: async (
    params?: { warehouse?: string; page?: number; limit?: number },
    token?: string | null
  ): Promise<{ rows: BackendInventoryRow[]; pagination: Pagination }> => {
    const res = await api.get<InventoryResponse<BackendInventoryRow>>("/inventory", {
      params,
      headers: authHeaders(token),
    });
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  /** GET /inventory/low-stock — at or below the reorder level. */
  lowStock: async (
    params?: { warehouse?: string },
    token?: string | null
  ): Promise<BackendInventoryRow[]> => {
    const res = await api.get<InventoryResponse<BackendInventoryRow>>(
      "/inventory/low-stock",
      { params, headers: authHeaders(token) }
    );
    return unwrap(res);
  },

  /** GET /inventory/:productId — available units across warehouses. */
  availability: async (productId: string, token?: string | null) => {
    const res = await api.get<InventoryResponse<{ available: number }>>(
      `/inventory/${productId}`,
      { headers: authHeaders(token) }
    );
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return data?.available ?? 0;
  },

  /** GET /inventory/movements — the append-only audit trail. */
  movements: async (
    params?: MovementQueryParams,
    token?: string | null
  ): Promise<{ rows: BackendStockMovement[]; pagination: Pagination }> => {
    const res = await api.get<InventoryResponse<BackendStockMovement>>(
      "/inventory/movements",
      { params, headers: authHeaders(token) }
    );
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  /** GET /warehouses/choices — minimal active warehouse data for stock transfers. */
  warehouses: async (token?: string | null): Promise<BackendWarehouse[]> => {
    const res = await api.get<InventoryResponse<BackendWarehouse>>("/warehouses/choices", {
      headers: authHeaders(token),
    });
    return unwrap(res);
  },
};

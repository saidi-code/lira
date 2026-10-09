import { api } from "./api";
import type { Pagination } from "./orderApi";
import type { BackendWarehouse } from "./inventoryApi";

export type TransferStatus = "draft" | "in_transit" | "completed" | "cancelled";

export interface BackendTransferItem {
  product: string | { _id: string; name: string };
  name: string;
  sku?: string | null;
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

interface TransferResponse<T> {
  success: boolean;
  message?: string;
  data?: T | T[];
  pagination?: Pagination;
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const unwrap = <T>(res: TransferResponse<T>): T[] =>
  Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];

export const transfersApi = {
  list: async (
    params?: { status?: TransferStatus; warehouse?: string; page?: number; limit?: number },
    token?: string | null
  ): Promise<{ rows: BackendTransfer[]; pagination: Pagination }> => {
    const res = await api.get<TransferResponse<BackendTransfer>>("/transfers", {
      params,
      headers: authHeaders(token),
    });
    return {
      rows: unwrap(res),
      pagination: res.pagination ?? { total: 0, page: 1, pages: 1 },
    };
  },

  create: async (
    payload: {
      fromWarehouseId: string;
      toWarehouseId: string;
      items: { productId: string; sku?: string; quantity: number }[];
      notes?: string;
    },
    token?: string | null
  ) =>
    api.post<TransferResponse<BackendTransfer>>("/transfers", payload, {
      headers: authHeaders(token),
    }),

  setStatus: async (
    id: string,
    status: TransferStatus,
    token?: string | null
  ) =>
    api.put<TransferResponse<BackendTransfer>>(
      `/transfers/${id}/status`,
      { status },
      { headers: authHeaders(token) }
    ),
};

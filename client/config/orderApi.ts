import { api } from "./api";

// ==================== Types ====================

export type PaymentMethod = "cash" | "stripe";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "placed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Pagination {
  total: number;
  page: number;
  pages: number;
}

export interface BackendOrderItem {
  product: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
  subtotal: number;
}

export interface BackendShippingAddress {
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

export interface BackendOrder {
  _id: string;
  orderNumber: string;
  user: string | { _id: string; name: string; email: string };
  items: BackendOrderItem[];
  shippingAddress: BackendShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  notes?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  count?: number;
  data?: BackendOrder | BackendOrder[];
  pagination?: Pagination;
}

export interface PaginatedOrders {
  orders: BackendOrder[];
  pagination: Pagination;
}

export interface CreateOrderItemInput {
  product: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  shippingAddressId?: string;
  shippingAddress?: BackendShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  shippingCost?: number;
  tax?: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

const EMPTY_PAGINATION: Pagination = { total: 0, page: 1, pages: 1 };

// ==================== API ====================

export const orderApi = {
  /**
   * POST /api/orders
   */
  createOrder: async (
    payload: CreateOrderInput,
    token?: string | null
  ): Promise<BackendOrder | null> => {
    const res = await api.post<OrderResponse>("/orders", payload, {
      headers: authHeaders(token),
    });
    console.log("create order response",res)
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /**
   * GET /api/orders/my?page=&limit=&status=   (paginated)
   */
  getMyOrders: async (
    token?: string | null,
    params?: OrderQueryParams
  ): Promise<PaginatedOrders> => {
    const res = await api.get<OrderResponse>("/orders/my", {
      params,
      headers: authHeaders(token),
    });

    return {
      orders: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination ?? EMPTY_PAGINATION,
    };
  },

  /**
   * GET /api/orders/:id
   */
  getOrderById: async (
    orderId: string,
    token?: string | null
  ): Promise<BackendOrder | null> => {
    const res = await api.get<OrderResponse>(`/orders/${orderId}`, {
      headers: authHeaders(token),
    });
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /**
   * PUT /api/orders/:id/cancel
   */
  cancelOrder: async (
    orderId: string,
    token?: string | null
  ): Promise<BackendOrder | null> => {
    const res = await api.put<OrderResponse>(
      `/orders/${orderId}/cancel`,
      {},
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /**
   * GET /api/orders?page=&limit=&status=&paymentStatus=   (admin, paginated)
   */
  getAllOrders: async (
    token?: string | null,
    params?: OrderQueryParams
  ): Promise<PaginatedOrders> => {
    const res = await api.get<OrderResponse>("/orders", {
      params,
      headers: authHeaders(token),
    });

    return {
      orders: Array.isArray(res.data) ? res.data : [],
      pagination: res.pagination ?? EMPTY_PAGINATION,
    };
  },

  /**
   * PUT /api/orders/:id/status  (admin)
   */
  updateOrderStatus: async (
    orderId: string,
    payload: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus },
    token?: string | null
  ): Promise<BackendOrder | null> => {
    const res = await api.put<OrderResponse>(
      `/orders/${orderId}/status`,
      payload,
      { headers: authHeaders(token) }
    );
    return !Array.isArray(res.data) ? res.data ?? null : null;
  },

  /**
   * DELETE /api/orders/:id  (admin)
   */
  deleteOrder: async (
    orderId: string,
    token?: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    const res = await api.delete<OrderResponse>(`/orders/${orderId}`, {
      headers: authHeaders(token),
    });
    return { success: res.success, message: res.message };
  },
};
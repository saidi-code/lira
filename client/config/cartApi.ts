import { api } from "./api";
import { ICartItem, IProduct } from "../constants/types";

export interface BackendCartItem {
  _id?: string;
  product: IProduct;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
}

export interface BackendCart {
  _id: string;
  user: string;
  items: BackendCartItem[];
  totalAmount: number;
}

export interface CartResponse {
  success: boolean;
  message?: string;
  data: BackendCart;
}

export interface AddToCartInput {
  productId: string;
  quantity?: number;
  size?: string | null;
  color?: string | null;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

export interface DeleteCartItemInput {
  productId: string;
  size?: string | null;
  color?: string | null;
}

export const cartApi = {
  getCart: async (token?: string | null): Promise<BackendCart> => {
    const res = await api.get<CartResponse>("/cart", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },

  addToCart: async (
    payload: AddToCartInput,
    token?: string | null
  ): Promise<BackendCart> => {
    const res = await api.post<CartResponse>(
      "/cart/add",
      {
        productId: payload.productId,
        quantity: payload.quantity ?? 1,
        size: payload.size ?? null,
        color: payload.color ?? null,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  },

  updateCartItem: async (
    payload: UpdateCartItemInput,
    token?: string | null
  ): Promise<BackendCart> => {
    // Strip composite id if present (e.g. productId::size::color)
    const rawId = payload.productId.includes("::")
      ? payload.productId.split("::")[0]
      : payload.productId;

    const res = await api.put<CartResponse>(
      `/cart/item/${rawId}`,
      {
        quantity: payload.quantity,
        size: payload.size ?? null,
        color: payload.color ?? null,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  },

  deleteCartItem: async (
    payload: DeleteCartItemInput,
    token?: string | null
  ): Promise<BackendCart> => {
    const rawId = payload.productId.includes("::")
      ? payload.productId.split("::")[0]
      : payload.productId;

    const res = await api.delete<CartResponse>(`/cart/item/${rawId}`, {
      params: {
        size: payload.size ?? undefined,
        color: payload.color ?? undefined,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },

  clearCart: async (token?: string | null): Promise<BackendCart> => {
    const res = await api.delete<CartResponse>("/cart", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },
};

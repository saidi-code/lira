import type { Product } from "@lira/shared";
import { api, type Envelope } from "./api";

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
};

export type Cart = {
  _id: string;
  items: CartItem[];
  totalAmount: number;
};

export const cartApi = {
  get: (token?: string | null) =>
    api.get<Envelope<Cart>>("/cart", { token }).then((r) => r.data),
  add: (
    payload: {
      productId: string;
      quantity?: number;
      size?: string | null;
      color?: string | null;
    },
    token?: string | null
  ) => api.post<Envelope<Cart>>("/cart/add", payload, { token }).then((r) => r.data),
  update: (
    productId: string,
    payload: { quantity: number; size?: string | null; color?: string | null },
    token?: string | null
  ) =>
    api
      .put<Envelope<Cart>>(`/cart/item/${productId}`, payload, { token })
      .then((r) => r.data),
  remove: (
    productId: string,
    params: { size?: string | null; color?: string | null },
    token?: string | null
  ) =>
    api
      .delete<Envelope<Cart>>(`/cart/item/${productId}`, { token, params })
      .then((r) => r.data),
};

export type Address = {
  _id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
};

export const addressApi = {
  list: (token?: string | null) =>
    api.get<Envelope<Address[]>>("/addresses/user", { token }).then((r) =>
      Array.isArray(r.data) ? r.data : []
    ),
};

export type Order = {
  _id: string;
  orderNumber: string;
  items: {
    name: string;
    image?: string;
    price: number;
    quantity: number;
    size?: string | null;
    color?: string | null;
  }[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  createdAt: string;
};

export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ord-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const orderApi = {
  create: (
    body: {
      items: {
        product: string;
        quantity: number;
        size?: string | null;
        color?: string | null;
      }[];
      shippingAddressId?: string;
      paymentMethod: "cash" | "stripe";
    },
    token?: string | null,
    idempotencyKey?: string
  ) =>
    api
      .post<Envelope<Order>>("/orders", body, {
        token,
        headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      })
      .then((r) => r.data),
  mine: (token?: string | null) =>
    api.get<Envelope<Order[]>>("/orders/my", { token }).then((r) => ({
      orders: Array.isArray(r.data) ? r.data : [],
      pagination: r.pagination,
    })),
  one: (id: string, token?: string | null) =>
    api.get<Envelope<Order>>(`/orders/${id}`, { token }).then((r) => r.data),
};

export type WishList = {
  items: { product: Product }[];
};

export const wishlistApi = {
  get: (token?: string | null) =>
    api.get<Envelope<WishList>>("/wishlist", { token }).then((r) => r.data),
  add: (productId: string, token?: string | null) =>
    api
      .post<Envelope<WishList>>("/wishlist/add", { productId }, { token })
      .then((r) => r.data),
  remove: (productId: string, token?: string | null) =>
    api
      .delete<Envelope<WishList>>(`/wishlist/remove/${productId}`, { token })
      .then((r) => r.data),
};

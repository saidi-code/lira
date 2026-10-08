import { api } from "./api";
import { IProduct } from "../constants/types";

export interface BackendWishListItem {
  _id?: string;
  product: IProduct;
}

export interface BackendWishList {
  _id: string;
  user: string;
  items: BackendWishListItem[];
}

export interface WishListResponse {
  success: boolean;
  message?: string;
  data: BackendWishList;
}

export const favorisApi = {
  getWishList: async (token?: string | null): Promise<BackendWishList> => {
    const res = await api.get<WishListResponse>("/wishlist", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },

  addToWishList: async (
    productId: string,
    token?: string | null
  ): Promise<BackendWishList> => {
    const res = await api.post<WishListResponse>(
      "/wishlist/add",
      { productId },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return res.data;
  },

  removeFromWishList: async (
    productId: string,
    token?: string | null
  ): Promise<BackendWishList> => {
    const res = await api.delete<WishListResponse>(`/wishlist/remove/${productId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },
};

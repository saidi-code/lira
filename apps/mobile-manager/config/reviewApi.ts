// config/reviewApi.ts
import { api } from "./api";

// ==================== Types ====================
export interface ReviewUser {
  _id: string;
  name?: string;
  image?: string;
}

export interface ReviewProduct {
  _id: string;
  name: string;
  images?: string[];
  price?: number;
}

export interface BackendReview {
  _id: string;
  user: ReviewUser | string;
  product: ReviewProduct | string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ProductReviewsResponse {
  success: boolean;
  count: number;
  averageRating: number;
  data: BackendReview[];
}

export interface ReviewsListResponse {
  success: boolean;
  count: number;
  data: BackendReview[];
}

export interface ReviewActionResponse {
  success: boolean;
  message?: string;
  data?: BackendReview;
}

export interface CreateReviewInput {
  rating: number;
  comment?: string;
}

// ==================== Helpers ====================
const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

// ==================== API ====================
export const reviewApi = {
  /** GET /reviews/product/:id — public, includes averageRating */
  getProductReviews: async (productId: string): Promise<ProductReviewsResponse> => {
    return api.get<ProductReviewsResponse>(`/reviews/product/${productId}`);
  },

  /** POST /reviews/product/:id — create or replace my review */
  upsertReview: async (
    productId: string,
    payload: CreateReviewInput,
    token?: string | null
  ): Promise<ReviewActionResponse> => {
    return api.post<ReviewActionResponse>(`/reviews/product/${productId}`, payload, {
      headers: authHeaders(token),
    });
  },

  /** GET /reviews/my — my reviews (with product info) */
  getMyReviews: async (token?: string | null): Promise<ReviewsListResponse> => {
    return api.get<ReviewsListResponse>("/reviews/my", {
      headers: authHeaders(token),
    });
  },

  /** DELETE /reviews/:id — owner or admin */
  deleteReview: async (
    reviewId: string,
    token?: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    return api.delete<{ success: boolean; message?: string }>(`/reviews/${reviewId}`, {
      headers: authHeaders(token),
    });
  },
};
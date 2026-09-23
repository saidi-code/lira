// hooks/useReviews.ts
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-native-toast-message";
import {
  reviewApi,
  CreateReviewInput,
  ProductReviewsResponse,
  ReviewsListResponse,
} from "../config/reviewApi";
import { openAuthModal } from "./useCart";

// ==========================================
// 1. Query Keys
// ==========================================
export const reviewKeys = {
  all: ["reviews"] as const,
  product: (productId: string) =>
    [...reviewKeys.all, "product", productId] as const,
  my: () => [...reviewKeys.all, "my"] as const,
};

// ==========================================
// 2. Query: useProductReviews (public)
// ==========================================
export function useProductReviews(productId?: string) {
  return useQuery<ProductReviewsResponse, Error>({
    queryKey: reviewKeys.product(productId ?? ""),
    queryFn: () => reviewApi.getProductReviews(productId!),
    enabled: Boolean(productId),
    staleTime: 1000 * 60,
  });
}

// ==========================================
// 3. Query: useMyReviews
// ==========================================
export function useMyReviews() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<ReviewsListResponse, Error>({
    queryKey: reviewKeys.my(),
    queryFn: async () => {
      const token = await getToken();
      return reviewApi.getMyReviews(token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60,
  });
}

// ==========================================
// 4. Mutation: useSubmitReview (upsert)
// ==========================================
export function useSubmitReview() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      input,
    }: {
      productId: string;
      input: CreateReviewInput;
    }) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return reviewApi.upsertReview(productId, input, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: reviewKeys.product(variables.productId),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.my() });
      toast.show({
        type: "successToast",
        text2: "شكراً! تم حفظ تقييمك",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء حفظ التقييم";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
    },
  });
}

// ==========================================
// 5. Mutation: useDeleteReview
// ==========================================
export function useDeleteReview() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId?: string }) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return reviewApi.deleteReview(reviewId, token);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      if (variables.productId) {
        queryClient.invalidateQueries({
          queryKey: reviewKeys.product(variables.productId),
        });
      }
      toast.show({
        type: "successToast",
        text2: "تم حذف التقييم",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء حذف التقييم";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
    },
  });
}
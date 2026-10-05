import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import toast from "react-native-toast-message";
import {
  BackendWishList,
  favorisApi,
} from "../config/favorisApi";
import { IFavorisItem, IProduct } from "../constants/types";
import { openAuthModal } from "./useCart";

// ==========================================
// 1. TanStack Query Keys
// ==========================================
export const favorisKeys = {
  all: ["favoris"] as const,
  userFavoris: () => [...favorisKeys.all, "user"] as const,
};

// ==========================================
// 2. Helper: Map Backend WishList to IFavorisItem[]
// ==========================================
export function mapBackendWishListToItems(
  wishList?: BackendWishList | null
): IFavorisItem[] {
  if (!wishList || !Array.isArray(wishList.items)) return [];
  return wishList.items
    .filter((item) => item?.product != null)
    .map((item) => ({
      productId: item.product?._id ?? "",
      product: item.product,
    }));
}

// ==========================================
// 3. Query Hook: useFavorisQuery
// ==========================================
export function useFavorisQuery() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendWishList, Error>({
    queryKey: favorisKeys.userFavoris(),
    queryFn: async () => {
      if (!isSignedIn) {
        return { _id: "", user: "", items: [] };
      }
      const token = await getToken();
      return favorisApi.getWishList(token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const favorisItem = useMemo(
    () => (isSignedIn ? mapBackendWishListToItems(query.data) : []),
    [isSignedIn, query.data]
  );

  const likedSet = useMemo(() => {
    return new Set(favorisItem.map((item) => item.productId));
  }, [favorisItem]);

  const isLiked = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return likedSet.has(productId);
    },
    [likedSet]
  );

  return {
    ...query,
    wishList: query.data,
    favorisItem,
    itemsCount: favorisItem.length,
    isLiked,
  };
}

// ==========================================
// 4. Mutation Hook: useAddToFavoris
// ==========================================
export function useAddToFavoris() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return favorisApi.addToWishList(productId, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(favorisKeys.userFavoris(), data);
      queryClient.invalidateQueries({ queryKey: favorisKeys.userFavoris() });
      toast.show({
        type: "successToast",
        text2: "تمت إضافة المنتج إلى المفضلة",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      console.error("useAddToFavoris error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 5. Mutation Hook: useRemoveFromFavoris
// ==========================================
export function useRemoveFromFavoris() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return favorisApi.removeFromWishList(productId, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(favorisKeys.userFavoris(), data);
      queryClient.invalidateQueries({ queryKey: favorisKeys.userFavoris() });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      console.error("useRemoveFromFavoris error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 6. Unified useFavoris Hook
// ==========================================
export function useFavoris() {
  const { isSignedIn } = useAuth();
  const favorisQuery = useFavorisQuery();
  const addToFavorisMutation = useAddToFavoris();
  const removeFromFavorisMutation = useRemoveFromFavoris();

  const loading =
    favorisQuery.isLoading ||
    addToFavorisMutation.isLoading ||
    removeFromFavorisMutation.isLoading;

  const addToFavoris = useCallback(
    async (product: IProduct | { _id: string }) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      const productId = product?._id;
      if (!productId) return;
      return addToFavorisMutation.mutateAsync(productId);
    },
    [isSignedIn, addToFavorisMutation]
  );

  const removeFromFavoris = useCallback(
    async (productId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      if (!productId) return;
      return removeFromFavorisMutation.mutateAsync(productId);
    },
    [isSignedIn, removeFromFavorisMutation]
  );

  const toggleLike = useCallback(
    async (product: IProduct | { _id: string }) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      const productId = product?._id;
      if (!productId) return;

      if (favorisQuery.isLiked(productId)) {
        return removeFromFavoris(productId);
      } else {
        return addToFavoris(product as IProduct);
      }
    },
    [isSignedIn, favorisQuery, removeFromFavoris, addToFavoris]
  );

  return {
    // Data
    favorisItem: favorisQuery.favorisItem,
    itemsCount: favorisQuery.itemsCount,
    isLiked: favorisQuery.isLiked,
    loading,
    isLoading: loading,

    // Actions
    addToFavoris,
    removeFromFavoris,
    toggleLike,
    refetch: favorisQuery.refetch,
    getWishList: favorisQuery.refetch,

    // Raw Mutations
    addToFavorisMutation,
    removeFromFavorisMutation,
  };
}

export default useFavoris;

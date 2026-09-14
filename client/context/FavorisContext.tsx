import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { IFavorisContextValue, IFavorisItem, IProduct } from "../constants/types";
import { apiClient } from "../config/api";

const FavorisContext = createContext<IFavorisContextValue | undefined>(undefined);

export const FavorisProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth();
  const [favorisItem, setFavorisItem] = useState<IFavorisItem[]>([]);

  // Fast O(1) set lookup for isLiked
  const likedSet = useMemo(() => {
    return new Set(favorisItem.map((f) => f.productId));
  }, [favorisItem]);

  const isLiked = useCallback(
    (productId: string) => {
      if (!productId) return false;
      return likedSet.has(productId);
    },
    [likedSet]
  );

  const getWishList = useCallback(async () => {
    if (!isSignedIn) {
      setFavorisItem([]);
      return;
    }
    try {
      const token = await getToken();
      const { data } = await apiClient.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data?.success) {
        const wishList = data.data;
        const itemsArray = Array.isArray(wishList?.items) ? wishList.items : [];

        const mappedFavorisItems: IFavorisItem[] = itemsArray.map((item: any) => ({
          productId: item?.product?._id ?? "",
          product: item?.product ?? undefined,
        }));

        setFavorisItem(mappedFavorisItems);
      } else {
        setFavorisItem([]);
      }
    } catch (error) {
      console.error("Error Fetch Wish List", error);
    }
  }, [getToken, isSignedIn]);

  const addToFavoris = useCallback(
    async (product: IProduct) => {
      if (!product?._id) return;

      // Optimistic update
      setFavorisItem((prev) => {
        if (prev.some((f) => f.productId === product._id)) return prev;
        return [...prev, { productId: product._id, product }];
      });

      if (!isSignedIn) return;

      try {
        const token = await getToken();
        await apiClient.post(
          "/wishlist/add",
          { productId: product._id },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Error adding to wish list:", error);
        // Revert on error
        getWishList();
      }
    },
    [getToken, isSignedIn, getWishList]
  );

  const removeFromFavoris = useCallback(
    async (productId: string) => {
      if (!productId) return;

      // Optimistic update
      setFavorisItem((prev) => prev.filter((f) => f.productId !== productId));

      if (!isSignedIn) return;

      try {
        const token = await getToken();
        await apiClient.delete(`/wishlist/remove/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Error removing from wish list:", error);
        // Revert on error
        getWishList();
      }
    },
    [getToken, isSignedIn, getWishList]
  );

  const toggleLike = useCallback(
    async (product: IProduct) => {
      if (!product?._id) return;
      if (isLiked(product._id)) {
        await removeFromFavoris(product._id);
      } else {
        await addToFavoris(product);
      }
    },
    [isLiked, removeFromFavoris, addToFavoris]
  );

  useEffect(() => {
    if (isSignedIn) {
      getWishList();
    } else {
      setFavorisItem([]);
    }
  }, [isSignedIn, getWishList]);

  const itemsCount = favorisItem.length;

  const value = useMemo(
    () => ({
      favorisItem,
      isLiked,
      addToFavoris,
      removeFromFavoris,
      toggleLike,
      getWishList,
      itemsCount,
    }),
    [favorisItem, isLiked, addToFavoris, removeFromFavoris, toggleLike, getWishList, itemsCount]
  );

  return <FavorisContext.Provider value={value}>{children}</FavorisContext.Provider>;
};

export function useFavoris() {
  const ctx = useContext(FavorisContext);
  if (!ctx) throw new Error("useFavoris must be used within FavorisProvider");
  return ctx;
}

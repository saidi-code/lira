import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    IFavorisContextValue,
    IFavorisItem,
    IProduct,
} from "../constants/types";
// Favories store only the product ids (and optional size/color if you need it later)
import axios from "../config/api";
import {useAuth} from "@clerk/clerk-expo"
const FavorisContext = createContext<IFavorisContextValue | undefined>(
  undefined,
);

export const FavorisProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { getToken, isSignedIn } = useAuth();
  const [favorisItem, setFavorisItem] = useState<IFavorisItem[]>([]);

  
  const isLiked = useMemo(
    () => (productId: string) =>

      favorisItem.some((f) => f.productId === productId),
    [favorisItem],
  );
const getWishList = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        const wishList = data.data;
        const itemsArray = Array.isArray(wishList?.items) ? wishList.items : [];

        // `items.product` is populated by the backend (name images price category)
        const mappedFavorisItems: IFavorisItem[] = itemsArray.map((item: any) => ({
          productId: item?.product?._id ?? "",
          product: item?.product ?? undefined,
        }));

        setFavorisItem(mappedFavorisItems);
      } else {
        setFavorisItem([]);
      }
    } catch (error: any) {
      console.error("Error Fetch Wish List", error);
    }
  const addToFavoris = (product: IProduct) => {
    setFavorisItem((prev) => {
      if (prev.some((f) => f.productId === product._id)) return prev;
      return [...prev, { productId: product._id }];
    });
  };

  const removeFromFavoris = (productId: string) => {
    setFavorisItem((prev) => prev.filter((f) => f.productId !== productId));
  };
  const itemsCount = favorisItem.length;

  return (
    <FavorisContext.Provider
      value={{
        favorisItem,
        isLiked,
        addToFavoris,
        removeFromFavoris,
        toggleLike,
        getWishList,
        itemsCount,
      }}
    >
      {children}
    </FavorisContext.Provider>
  );
};
const addToFavoris = async (product: IProduct) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/wishlist/add",
        { productId: product._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        const wishList = data.data;
        const itemsArray = Array.isArray(wishList?.items) ? wishList.items : [];
        const mappedFavorisItems: IFavorisItem[] = itemsArray.map((item: any) => ({
          productId: item?.product?._id ?? "",
        }));
        setFavorisItem(mappedFavorisItems);
      }
    } catch (error: any) {
      console.error("Error Add To Wish List", error);
    }
  };
const removeFromFavoris = async (productId: string) => {
    try {
      const token = await getToken();
      const { data } = await axios.delete(`/wishlist/remove/${productId}`, {
        headers: {  
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        const wishList = data.data;
        const itemsArray = Array.isArray(wishList?.items) ? wishList.items : [];
        const mappedFavorisItems: IFavorisItem[] = itemsArray.map((item: any) => ({
          productId: item?.product?._id ?? "",
        }));
        setFavorisItem(mappedFavorisItems);
      }
    } catch (error: any) {
      console.error("Error Remove From Wish List", error);
    }
  };    
const toggleLike = async (product: IProduct) => {
    if (isLiked(product._id)) {
      await removeFromFavoris(product._id);
    } else {
      await addToFavoris(product);
    }   
}
const itemsCount = favorisItem.length;

  useEffect(() => {
    if (isSignedIn) {
      getWishList();
    } else {
      setFavorisItem([]);
     
    }
  }, [isSignedIn]);
return <FavorisContext.Provider
    value={{
        favorisItem,
        isLiked,
        addToFavoris,
        removeFromFavoris,
        toggleLike,
        getWishList,
        itemsCount,   }}>
      {children}
    </FavorisContext.Provider>
}
export function useFavoris() {
  const ctx = useContext(FavorisContext);
  if (!ctx) throw new Error("useFavoris must be used within FavorisProvider");
  return ctx;
}
    
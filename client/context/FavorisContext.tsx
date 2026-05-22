import React, { createContext, useContext, useMemo, useState } from "react";
import {
    IFavorisContextValue,
    IFavorisItem,
    IProduct,
} from "../constants/types";
// Favories store only the product ids (and optional size/color if you need it later)

const FavorisContext = createContext<IFavorisContextValue | undefined>(
  undefined,
);

export const FavorisProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favorisItem, setFavorisItem] = useState<IFavorisItem[]>([]);

  const isLiked = useMemo(
    () => (productId: string) =>
      favorisItem.some((f) => f.productId === productId),
    [favorisItem],
  );

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
        itemsCount,
      }}
    >
      {children}
    </FavorisContext.Provider>
  );
};

export function useFavoris() {
  const ctx = useContext(FavorisContext);
  if (!ctx) throw new Error("useFavoris must be used within FavorisProvider");
  return ctx;
}

import React, { useState, useCallback, memo } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Pressable, View } from "react-native";
import { ProductCardProps } from "../constants/types";
import ChooseColorSizeModal from "./productCardComponents/ChooseColorSizeModal";
import ProductCardCategoryComponent from "./productCardComponents/ProductCategoryComponent";
import ProductNameComponent from "./productCardComponents/ProductNameComponent";
import ProductPriceComponent from "./productCardComponents/ProductPriceComponent";
import AddToCartBtn from "./productCardComponents/AddToCartBtn";
import AddToFavorisBtn from "./productCardComponents/AddToFavorisBtn";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/config/api";
import ProductImage from "./productCardComponents/ProductImage";

const ProductCard = memo(({ product }: ProductCardProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const handleOpenVariableModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleProductHover = useCallback(
    (productId: string) => {
      if (!productId) return;
      queryClient.prefetchQuery({
        queryKey: ["product", productId],
        queryFn: async () => {
          const res = await api.get(`/products/${productId}`);
          return res.data ?? res;
        },
        staleTime: 5 * 60 * 1000,
      });
    },
    [queryClient]
  );

  const handlePress = useCallback(() => {
    if (!product?._id) return;
    handleProductHover(product._id);
    router.push(`/product/${product._id}`);
  }, [product?._id, handleProductHover, router]);

  const categoryTitle =
    (product?.category as any)?.title ??
    (typeof product?.category === "string" ? product.category : "");

  return (
    <Pressable style={styles.productCard} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <ProductImage product={product} />
        <AddToFavorisBtn product={product} />
      </View>

      <View className="p-3 bg-card rounded-3xl shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-[#b89354]/5 self-stretch">
        <ProductCardCategoryComponent productCategory={categoryTitle} />
        <ProductNameComponent productName={product.name} />

        <View className="flex-row justify-between items-center mt-1">
          <AddToCartBtn
            product={product}
            handleOpenVariableModal={handleOpenVariableModal}
          />
          <ProductPriceComponent productPrice={product.price} />
        </View>

        {showModal && (
          <ChooseColorSizeModal
            show={showModal}
            setShow={setShowModal}
            product={product ?? null}
          />
        )}
      </View>
    </Pressable>
  );
});

ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    maxWidth: 200,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: "#fcf9f1",
  },
});

export default ProductCard;

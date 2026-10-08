import React, { memo, useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ChooseColorSizeModal from "./productCardComponents/ChooseColorSizeModal";
import AddToCartBtn from "./productCardComponents/AddToCartBtn";
import AddToFavorisBtn from "./productCardComponents/AddToFavorisBtn";
import ProductImage from "./productCardComponents/ProductImage";
import { useAppColors, type Colors } from "@/constants/utility";
import { usePrice } from "../hooks/usePrice";
import type { IProduct, ProductCardProps } from "../constants/types";

const ProductCard = memo(({ product }: ProductCardProps) => {
  const router = useRouter();
  const colors = useAppColors();
  const formatPrice = usePrice();
  const [showModal, setShowModal] = useState(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handlePress = useCallback(() => {
    if (!product?._id) return;
    router.push(`/product/${product._id}`);
  }, [product?._id, router]);

  // The API sometimes populates `category` to an object; fall back to "".
  const categoryTitle =
    typeof product?.category === "string"
      ? product.category
      : ((product?.category as { title?: string } | undefined)?.title ?? "");

  return (
    <Pressable style={styles.productCard} onPress={handlePress}>
      <View style={styles.imageContainer}>
        <ProductImage product={product} />
        <AddToFavorisBtn product={product} />
      </View>

      <View style={styles.body}>
        <Text style={styles.category}>
          {categoryTitle.trim() || "إكسسوارات"}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {product.name?.trim() || "اسم المنتج"}
        </Text>

        <View style={styles.row}>
          <AddToCartBtn
            product={product}
            handleOpenVariableModal={() => setShowModal(true)}
          />
          <Text style={styles.price}>{formatPrice(product.price ?? 0)}</Text>
        </View>

        <ChooseColorSizeModal
          show={showModal}
          setShow={setShowModal}
          product={product}
        />
      </View>
    </Pressable>
  );
});

ProductCard.displayName = "ProductCard";

const makeStyles = (colors: Colors) =>
  StyleSheet.create({
    productCard: {
      flex: 1,
      marginHorizontal: 6,
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: colors.shadow,
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
    body: {
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 24,
    },
    category: {
      fontSize: 12,
      textAlign: "right",
      fontWeight: "500",
      color: colors.primary,
      fontFamily: "Tajawal-Medium",
    },
    name: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.body,
      textAlign: "right",
      fontFamily: "Tajawal-Medium",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    price: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "right",
      paddingBottom: 12,
      paddingTop: 4,
      fontFamily: "Tajawal-Medium",
    },
  });

export default ProductCard;


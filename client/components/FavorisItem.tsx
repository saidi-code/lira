import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import React, { useMemo, useCallback, memo } from "react";
import { Text, TouchableOpacity, View, Pressable } from "react-native";
import { Image } from "expo-image";
import { usePrice } from "../hooks/usePrice";
import { FavorisItemsProps } from "../constants/types";
import { useCart } from "../hooks/useCart";
import { useFavoris } from "../hooks/useFavoris";
import { useRouter } from "expo-router";

const FavorisItem = memo(({ product }: FavorisItemsProps) => {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleLike } = useFavoris();
  const price = usePrice();

  const imageUri = useMemo(() => {
    if (!product) return undefined;
    return product?.images?.[0] ?? product?.colors?.[0]?.images?.[0];
  }, [product]);

  const handleToggleLike = useCallback(() => {
    if (!product?._id) return;
    toggleLike(product);
  }, [product, toggleLike]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addToCart(product, null, null);
  }, [product, addToCart]);

  const handleNavigate = useCallback(() => {
    if (!product?._id) return;
    router.push(`/product/${product._id}`);
  }, [product?._id, router]);

  if (!product) return null;

  return (
    <View className="self-stretch p-4 bg-card rounded-xl shadow-lg flex-row justify-start items-center gap-4 mb-4">
      {/* Texts */}
      <View className="flex-1 flex-col justify-between items-start">
        <View className="self-stretch flex-col justify-start items-start gap-1">
          <View className="self-stretch flex-row justify-between items-start">
            <TouchableOpacity
              onPress={handleToggleLike}
              className="flex-col justify-center items-center p-1"
            >
              <Ionicons name="heart-sharp" color="#b89354" size={20} />
            </TouchableOpacity>

            <Pressable onPress={handleNavigate} className="flex-col justify-start items-end flex-1 ml-2">
              <Text
                className="text-right text-body text-lg font-body"
                numberOfLines={1}
              >
                {product.name}
              </Text>
            </Pressable>
          </View>

          <View className="self-stretch flex-col justify-start items-end">
            <Text className="text-right text-[#645d59] text-xs font-tajwal font-medium tracking-wide">
              {product.subtitle}
            </Text>
          </View>
        </View>

        {/* Button + Price */}
        <View className="self-stretch pt-4 flex-col justify-start items-start">
          <View className="self-stretch flex-row justify-between items-end">
            <TouchableOpacity
              onPress={handleAddToCart}
              activeOpacity={0.8}
              className="px-4 py-2 bg-[#b89354] rounded-full flex-row justify-start items-center gap-1"
            >
              <Text className="text-center text-white text-base font-body">
                إضافة للحقيبة
              </Text>
              <SimpleLineIcons name="handbag" size={14} color="#fff" />
            </TouchableOpacity>

            <View className="flex-col justify-start items-end">
              <Text className="text-right text-[#785920] text-base font-body">
                {price(product.price)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Product image */}
      <Pressable onPress={handleNavigate} className="w-28 h-32 rounded-lg overflow-hidden bg-subtle">
        <Image
          source={{ uri: imageUri }}
          style={{ width: 112, height: 128 }}
          cachePolicy="memory-disk"
          contentFit="cover"
          transition={200}
        />
      </Pressable>
    </View>
  );
});

FavorisItem.displayName = "FavorisItem";

export default FavorisItem;

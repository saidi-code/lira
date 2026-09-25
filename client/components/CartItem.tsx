import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState, useCallback, memo } from "react";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { CURRENCY } from "../constants/index";
import { pushTo } from "../constants/utility";
import { CartItemProps } from "../constants/types";
import { router } from "expo-router";

const CartItem = memo(({ item, removeItem, updateItemQuantity }: CartItemProps) => {
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);

  useEffect(() => {
    setQuantity(item?.quantity ?? 1);
  }, [item?.quantity]);

  const addQuantity = useCallback(() => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    updateItemQuantity(item._id, newQuantity, item.size ?? null, item.color ?? null);
  }, [item._id, item.size, item.color, quantity, updateItemQuantity]);

  const subtractQuantity = useCallback(() => {
    if (quantity <= 1) return;
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    updateItemQuantity(item._id, newQuantity, item.size ?? null, item.color ?? null);
  }, [item._id, item.size, item.color, quantity, updateItemQuantity]);

  const isVariable = item?.product?.type === "variable";
  const isProductHasColors = Boolean(item?.color);
  const isProductHasSizes = Boolean(item?.size);

  const imageUri =
    item?.product?.images?.[0] ?? item?.product?.colors?.[0]?.images?.[0];

  return (
    <View
      style={{
        shadowColor: "rgba(120, 89, 32, 0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
        backgroundColor: "#fff",
        marginBottom: 24,
        width: "100%",
        flexDirection: "row",
        borderRadius: 20,
        alignContent: "center",
        position: "relative",
      }}
    >
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          removeItem(
            item?.product?._id ?? item?._id,
            item?.size ?? null,
            item?.product?.colors?.[0]?.hex ?? item?.color ?? null
          );
        }}
        className="absolute z-10 top-4 left-4 flex-col justify-center items-center p-1"
      >
        <Ionicons name="close-outline" color="#785920" size={20} />
      </TouchableOpacity>

      <View className="flex-1 flex-row justify-end gap-4 p-4">
        <View className="flex-col justify-between flex-1">
          <View className="flex-col justify-start items-end mt-4 mr-2">
            <Text
              className="text-right text-body text-lg font-body"
              numberOfLines={1}
            >
              {item?.product?.name}
            </Text>
            <Text className="text-right text-primary-600 text-xs font-medium tracking-wide">
              {item?.product?.subtitle}
            </Text>

            {/* Selected variant values */}
            {isVariable && (
              <View className="gap-1 mt-1">
                {isProductHasColors && (
                  <View className="items-center flex-row-reverse gap-1">
                    <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                      اللون:
                    </Text>
                    <View
                      className="h-4 w-4 rounded-md"
                      style={{
                        backgroundColor:
                          (item as any)?.product?.colors?.find(
                            (c: any) => c?.name === item?.color
                          )?.hex ?? "#000",
                        borderWidth: 1,
                        borderColor: "#B89354",
                        margin: 2,
                      }}
                    />
                  </View>
                )}
                {isProductHasSizes && (
                  <View className="items-center flex-row-reverse gap-1">
                    <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                      المقاس:
                    </Text>
                    <View
                      className="px-1 py-0.5 rounded-sm items-center justify-center"
                      style={{
                        borderWidth: 1,
                        borderColor: "#B89354",
                      }}
                    >
                      <Text className="text-right text-primary-600 text-[10px] font-medium uppercase">
                        {item?.size ?? ""}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Price & Quantity Row */}
          <View className="flex-row justify-between items-center mt-3">
            <View className="px-2 py-1 bg-[#fdf1ea] rounded-full flex-row justify-center items-center gap-3">
              <TouchableOpacity
                onPress={subtractQuantity}
                activeOpacity={0.7}
                className="w-5 h-5 rounded-full items-center justify-center"
                disabled={quantity <= 1}
              >
                <Ionicons name="remove-outline" color="#785920" size={12} />
              </TouchableOpacity>

              <Text className="text-center text-body text-sm font-body min-w-[12px]">
                {quantity}
              </Text>

              <TouchableOpacity
                onPress={addQuantity}
                activeOpacity={0.7}
                className="w-5 h-5 rounded-full items-center justify-center"
              >
                <Ionicons name="add-outline" color="#785920" size={12} />
              </TouchableOpacity>
            </View>

            <Text className="text-right text-primary-700 text-base font-body">
              {item?.product?.price ? item.product.price * quantity : 0} {CURRENCY}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (!item?.product?._id) return;
            pushTo(router, "/product/[id]", {
              id: String(item.product._id),
              color: item.color ?? "",
              size: item.size ?? "",
            });
          }}
        >
          <View className="rounded-lg overflow-hidden bg-subtle">
            <Image
              source={{ uri: imageUri }}
              style={{ width: 100, height: 130 }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={200}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
});

CartItem.displayName = "CartItem";

export default CartItem;

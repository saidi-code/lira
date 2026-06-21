import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { CartItemProps } from "../constants/types";
import { router } from "expo-router";

const CartItem = ({ item, removeItem, updateItemQuantity, loading }: CartItemProps) => {
  const isVariable = (item?.product as any)?.type === "variable";

  // For variable products, show the selected color/size (fallback to the first available)
  const selectedColor =
    item?.color ?? (item?.product as any)?.colors?.[0]?.name ?? "";
  const selectedSize =
    item?.size ?? (item?.product as any)?.colors?.[0]?.variants?.[0]?.size ?? "";


  return (
    <View
      key={item?._id}
      style={{
        shadowColor: "rgba(120, 89, 32, 0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
        backgroundColor: "#fff",
        marginBottom: 24,
        display: "flex",
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
            item?.product?.colors?.[0]?.hex ?? item?.color ?? null,
          );
        }}
        className="absolute z-10 top-4 left-4 flex-col justify-center items-center"
      >
        <Ionicons name="close-outline" color="#785920" size={20} />
      </TouchableOpacity>

      <View className="flex-1 flex-row justify-end gap-4 p-4">
        <View className="flex-col ">
          <View className="flex-col justify-start items-end mt-6 flex-1 mr-2">
            <Text
              className="text-right text-body text-lg font-body"
              numberOfLines={1}
            >
              {item?.product?.name}
            </Text>
            <Text className="text-right text-primary-600 text-xs  font-medium tracking-wide ">
              {item?.product?.subtitle}
            </Text>

            {/* Selected variant values (requested change) */}
            {isVariable &&  (
              <View className="gap-1">
                <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                  اللون: {selectedColor || item?.color || ""}
                </Text>
                <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                  المقاس: {selectedSize || item?.size || ""}
                </Text>


               
              </View>
            ) }
          </View>

          {/* Price & Quantity Row */}
          <View className=" flex-1 flex-row gap-4 items-center">
            <Text className="text-right text-primary-700 text-base font-body">
              {item?.product?.price} {CURRENCY}
            </Text>

            <View className="px-2 py-1 bg-[#fdf1ea] rounded-full flex-row justify-center items-center gap-4">
              <TouchableOpacity
                onPress={() =>
                  updateItemQuantity(
                    item._id,
                    item.quantity - 1,
                    item.size ?? null,
                    item.color ?? null,
                  )
                }
                activeOpacity={0.7}
                className="w-5 h-5 rounded-full items-center justify-center"
                disabled={item?.quantity <= 1}
              >
                <Ionicons name="remove-outline" color="#785920" size={12} />
              </TouchableOpacity>

              <Text className="text-center text-body text-base leading-6 font-body w-[8px]">
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  updateItemQuantity(
                    item._id,
                    item.quantity + 1,
                    item.size ?? null,
                    item.color ?? null,
                  )
                }
                activeOpacity={0.7}
                className="w-5 h-5 rounded-full items-center justify-center"
              >
                <Ionicons name="add-outline" color="#785920" size={12} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => {
            router.push({
              pathname: "/product/[id]",
              params: {
                id: item?.product?._id,
                color: selectedColor,
                size: selectedSize,
              } as any,
            });
          }}
        >
          <View className="rounded-lg overflow-hidden bg-gray-100">
            <Image
              source={{
                uri: item?.product?.images?.[0] ?? item?.product?.colors?.[0]?.images?.[0],
              }}
              style={{ width: 110, height: 110 * 1.33 }}
              defaultSource={require("../assets/images/productLoadingImage.png")}
              resizeMode="cover"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
};

export default CartItem;


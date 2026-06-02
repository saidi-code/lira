import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TouchableOpacity, View, } from "react-native";
import { CURRENCY } from "../constants/index";
import { CartItemProps } from "../constants/types";
import { COLORS } from "../constants/index";
import product from "@/app/product";
import { router, useRouter } from "expo-router";
import { Link } from "expo-router";
import { useCart } from "../context/CartContext";

const CartItem = ({ item, removeItem, updateItemQuantity, loading }: CartItemProps) => {
  //  console.log(item.product.vcolors?.[0]?.variants?.[0]?.sizes?.[0],"cart item image")
  const [selectedSize, setSelectedSize] = useState<any>( null);
  const [selectedColor, setSelectedColor] = useState<any>( null);


  return (
    <Pressable
      onPress={() => {
        // Navigate to product details page using Expo Router's Link component
        // We can also use the useRouter hook for programmatic navigation
        router.push(`/product/${item?.product?._id}`);
      }}
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
        // justifyContent removed to satisfy RN style types
        // justifyContent: 16,
        position: "relative",




      }}
    >
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          removeItem(item?.product?._id ?? item?._id, item?.size ?? null, item?.product?.colors?.[0]?.hex ?? item?.color ?? null);





        }}
        className="absolute z-10 top-4 left-4 flex-col justify-center items-center"
      >
        <Ionicons name="close-outline" color="#785920" size={20} />
      </TouchableOpacity>
      <View className="flex-1 flex-row justify-end gap-4 p-4">
        {/* Content Section - takes remaining space, no fixed height */}
        <View className="flex-col ">
          {/* Header Row: Decorative square + Title & Subtitle */}
          {/* Title and Subtitle - right-aligned for Arabic */}
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
            {/* Variable product size/color controls */}

            <View className="gap-1">
              <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                اختر اللون أو المقاس
              </Text>

              {/* Colors */}
              <View className="flex-row items-center gap-2 justify-end mt-1">
                {
                  item.product.colors.map((c: any, index: number) => (
                    <Pressable
                      key={index}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedColor(c?.name);
                        // if size exists already, keep it; else use first available size for this color
                        const nextSize = c?.variants?.[0]?.size ?? item?.size ?? null;
                        setSelectedSize(nextSize);
                        updateItemQuantity(
                          item._id,
                          item.quantity,
                          nextSize,
                          c?.name ?? null,
                        );
                      }}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: c?.hex, borderColor: "#785920" }}
                    />
                  ))
                }
              </View>

              {/* Sizes (based on selected color) */}
              <View className="flex-row items-center gap-2 justify-end mt-1">
                {(() => {
                  const selectedColorObj = item.product.colors.find((c: any) => c.name === selectedColor) ??
                    item.product.colors[0];
                  const variants = selectedColorObj?.variants ?? [];
                  return variants.map((v: any, index: number) => (
                    <Pressable
                      key={index}
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedSize(v?.size ?? null);
                        updateItemQuantity(
                          item._id,
                          item.quantity,
                          v?.size ?? null,
                          selectedColorObj?.name ?? null,
                        );
                      }}
                      className="h-5 w-5 items-center justify-center rounded-md border"
                      style={{
                        borderColor: selectedSize === v?.size ? "#785920" : "#e6e6e6",
                      }}
                    >
                      <Text className="text-primay-600 text-xs font-medium tracking-wide">
                        {v?.size}
                      </Text>
                    </Pressable>
                  ));
                })()}
              </View>
            </View>








          </View>

          {/* Price & Quantity Row */}
          <View className=" flex-1 flex-row gap-4 items-center">
            {/* Price - right-aligned */}
            <Text className="text-right text-primary-700 text-base font-body">
              {item?.product?.price} {CURRENCY}
            </Text>

            {/* Quantity Selector - left side with pill background */}
            <View className="px-2 py-1 bg-[#fdf1ea] rounded-full flex-row justify-center items-center gap-4">
              {/* Decrement Button */}
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

              {/* Quantity Value */}
              <Text className="text-center text-body text-base leading-6 font-body w-[8px]">
                {item.quantity}
              </Text>

              {/* Increment Button */}
              <TouchableOpacity
                onPress={() =>
                  updateItemQuantity(
                    item._id,
                    item.quantity + 1,
                    item?.size || null,
                    item?.color || null,
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
        {/* Product Image - responsive using aspect ratio (3:4 = 0.75) */}
        <View className="rounded-lg overflow-hidden bg-gray-100">
          <Image
            //  source={{
            //         uri:
            //           item?.product?.type === "simple"
            //             ? product?.images?.[0] ?? (product as any)?.vcolors?.[0]?.images?.[0]
            //             : (product as any)?.vcolors?.[0]?.images?.[0],
            //       }}
            source={{
              uri: item?.product?.images?.[0] ?? item?.product?.colors?.[0]?.images?.[0]
            }}
            style={{ width: 110, height: 110 * 1.33 }}
            defaultSource={require("../assets/images/productLoadingImage.png")}

            resizeMode="cover"
          />
        </View>
      </View>
    </Pressable>
  );
};

export default CartItem;

import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { CartItemProps } from "../constants/types";
import { router } from "expo-router";

const CartItem = ({ item, removeItem, updateItemQuantity, loading }: CartItemProps) => {
  console.log("Rendering Item product Type:", item?.product?.type);
  const isVariable = item?.product?.type === "variable";
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

            {/* Selected variant values */}
            {isVariable && (
              <View className="gap-1">
                {/*
                  item.color = color name coming from backend
                  We find the color object inside product.colors to display its HEX.
                */}

                <View className=" items-center flex-row-reverse gap-1 ">
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
                      outlineWidth: 1,
                      outlineColor:"#B89354",
                      shadowColor: "#fff",
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: 4,
                      outlineOffset:1,
                      margin: 4,
                    }}
                  />
                </View>
                <View className=" items-center flex-row-reverse gap-1 ">
                  <Text className="text-right text-primary-600 text-[10px] font-medium tracking-wide">
                    المقاس:
                  </Text>
                  <View
                    className="h-4 w-4 rounded-sm items-center justify-center"
                    style={{
                      backgroundColor: "transparent",
                      outlineWidth: 1,
                      outlineColor:"#B89354",
                      shadowColor: "#fff",
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: 4,
                      outlineOffset:1,
                      margin: 4,
                    }}
                  >
                    <Text className="text-right text-primary-600 text-xs font-medium tracking-wide  uppercase">{item?.size ?? ""}</Text>
                  </View>
                </View>
              </View>
            )}


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
                    item.quantity = item.quantity + 1,
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
                color: item?.color,
                size: item?.size,
                quantity: item.quantity - 1,
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


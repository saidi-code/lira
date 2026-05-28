import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { CartItemProps } from "../constants/types";
import {COLORS} from "../constants/index";
const CartItem = ({ item, removeItem, updateItemQuantity ,loading}: CartItemProps) => {
//  console.log(item.product.vcolors?.[0]?.variants?.[0]?.sizes?.[0],"cart item image")
console.log(item?.product?.images?.[0]) 
return (
    <View
      key={item?._id}
      className="mb-6 p-4 bg-white rounded-xl 
              flex-row justify-start items-center gap-4"
      style={{
        shadowColor: "rgba(120, 89, 32, 0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 4,
      }}
    >
      {/* Content Section - takes remaining space, no fixed height */}
      <View className="flex-1 flex-col justify-between items-start gap-2">
        {/* Header Row: Decorative square + Title & Subtitle */}
        <View className="self-stretch flex-col justify-start items-start gap-1">
          <View className="self-stretch flex-row justify-between items-start">
            {/* Decorative square - appears on the right in RTL */}
           {
            loading ? 
            (
            <ActivityIndicator size={"small"} 
              color={COLORS.primary}
            />):
            (
               <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                removeItem(item?._id, item?.size ?? null, item?.color ?? null);
              }}
              className="flex-col justify-center items-center"
            >
              <Ionicons name="close-outline" color="#785920" size={20} />
            </TouchableOpacity>
            )
           }

            {/* Title and Subtitle - right-aligned for Arabic */}
            <View className="flex-col justify-start items-end flex-1 mr-2">
              <Text
                className="text-right text-body text-lg font-body"
                numberOfLines={1}
              >
                {item?.product?.name}
              </Text>
              {/* selected size (hide if null/empty) */}
              {(() => {
                const selectedSize =
                  (item?.product as any)?.vcolors?.[0]?.variants?.[0]?.sizes?.[0] ??
                  item?.size ??
                  "";

                if (!selectedSize) return null;

                return (
                  <View className="flex-row items-center gap-2 justify-end mt-1">
                    <View className="w-5 h-5 bg-[#fdf1ea] items-center rounded-md border border-primary">
                      <Text className="uppercase text-primay-600 text-xs font-medium tracking-wide">
                        {selectedSize}
                      </Text>
                    </View>

                    <Text className="text-right text-primay-600 text-xs font-medium tracking-wide">
                      المقاس:
                    </Text>
                  </View>
                );
              })()}

              {/* selected color (hide if null/empty) */}
              {(() => {
                const selectedColor =
                  (item?.product as any)?.vcolors?.[0]?.hex ??
                  item?.product?.colors?.[0]?.hex ??
                  null;

                if (!selectedColor) return null;

                return (
                  <View className="flex-row items-center gap-2 justify-end mt-1">
                    <View
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <Text className="text-right text-600 text-xs font-medium tracking-wide">
                      اللون:
                    </Text>
                  </View>
                );
              })()}

              <Text className="text-right text-600 text-xs  font-medium tracking-wide mt-1">
                {item?.product?.subtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Price & Quantity Row */}
        <View className="self-stretch pt-4 flex-row justify-between items-end">
          {/* Price - right-aligned */}
          <Text className="text-right text-primary-700 text-base font-body">
            {item?.product?.price} {CURRENCY}
          </Text>

          {/* Quantity Selector - left side with pill background */}
          <View className="px-3 py-1 bg-[#fdf1ea] rounded-full flex-row justify-center items-center gap-4">
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
              className="w-6 h-6 rounded-full items-center justify-center"
              disabled={item?.quantity <= 1}
            >
              <Ionicons name="remove-outline" color="#785920" size={12} />
            </TouchableOpacity>

            {/* Quantity Value */}
            <Text className="text-center text-body text-base leading-6 font-body min-w-[16px]">
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
              className="w-6 h-6 rounded-full items-center justify-center"
            >
              <Ionicons name="add-outline" color="#785920" size={12} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Product Image - responsive using aspect ratio (3:4 = 0.75) */}
      <View className="w-1/3 h-full 
      aspect-square 
      rounded-lg overflow-hidden">
        <Image
          source={{
            uri:
              item?.product?.type === "simple"
          ? 
                   
                    item?.product?.images?.[0]
                : (item?.product as any)?.vcolors?.[0]?.images?.[0],
          }}
          style={{ width:"100%", height: "100%" }}
          defaultSource={require("../assets/images/productLoadingImage.png")}
         
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

export default CartItem;

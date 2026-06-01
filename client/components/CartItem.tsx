import { Ionicons } from "@expo/vector-icons";
import React ,{useState}from "react";
import { ActivityIndicator, Image, Pressable, Text, TouchableOpacity, View ,} from "react-native";
import { CURRENCY } from "../constants/index";
import { CartItemProps } from "../constants/types";
import {COLORS} from "../constants/index";
import product from "@/app/product";
import {router, useRouter} from "expo-router";
import {Link} from "expo-router";
import { useCart } from "../context/CartContext";

const CartItem = ({ item, removeItem, updateItemQuantity ,loading}: CartItemProps) => { 
//  console.log(item.product.vcolors?.[0]?.variants?.[0]?.sizes?.[0],"cart item image")
const [selectedSize, setSelectedSize] = useState<number | null>(0);
const [selectedColor, setSelectedColor] = useState<number | null>(0);

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
        padding: 16,
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
            <View className="flex-1 flex-row gap-4 items-center justify-end">
      {/* Content Section - takes remaining space, no fixed height */}
      <View className="flex-col  gap-4 ">
        {/* Header Row: Decorative square + Title & Subtitle */}
         {/* Title and Subtitle - right-aligned for Arabic */}
            <View className="flex-col justify-start items-end mt-6 flex-1 mr-2">


              <Text
                className="text-right text-body text-lg font-body"
                numberOfLines={1}
              >
                {item?.product?.name}
              </Text>
             
            

              <Text className="text-right text-600 text-xs  font-medium tracking-wide mt-1">
                {item?.product?.subtitle}
              </Text>
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
            uri:  item?.product?.images?.[0] ?? item?.product?.colors?.[0]?.images?.[0] 
          }}
          style={{ width:100, height: 100 * 1.33 }}
          defaultSource={require("../assets/images/productLoadingImage.png")}
         
          resizeMode="cover"
        />
      </View>
      </View>
    </Pressable>
  );
};

export default CartItem;

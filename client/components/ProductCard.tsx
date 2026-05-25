import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CURRENCY } from "../constants/index";
import { IProduct, ProductCardProps } from "../constants/types";
import { useCart } from "../context/CartContext";
import { useFavoris } from "../context/FavorisContext";
const ProductCard = ({ product }: ProductCardProps) => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToFavoris, isLiked, removeFromFavoris } = useFavoris();

  const toggleLike = (product: IProduct) => {
    if (isLiked(product._id)) {
      removeFromFavoris(product._id);
    } else {
      addToFavoris(product);
    }
  };

  return (
    <Pressable
      className="flex-1"
      onPress={() => router.push(`/product/${product?._id}`)}
    >
      <View
        className="p-4 bg-white rounded-3xl 
      shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] 
      outline outline-1 outline-offset-[-1px]
       outline-[#b89354]/5 self-stretch"
      >
        {/* Image with gold badge */}
        <View
          className="relative bg-[#fcf9f1] 
        rounded-2xl overflow-hidden"
        >
          <Image
            source={{
              uri:
                product.type === "simple"
                  ? product.images?.[0]
                  : product.vcolors?.[0]?.images?.[0],
            }}
            defaultSource={require("../assets/images/productLoadingImage.png")}
            className="w-[125px] h-[125px]"
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(product);
            }}
            className="absolute left-3 top-3"
          >
            {isLiked(product._id) ? (
              <Ionicons name="heart-sharp" size={20} color={"#b89354"} />
            ) : (
              <Ionicons name="heart-outline" size={20} color={"#b89354"} />
            )}

            {/* <View className="w-[19px] h-[17.18px] bg-[#b89354]" /> */}
          </TouchableOpacity>
        </View>

        {/* Category */}
        <View className="pt-3 items-end">
          <Text className="text-right text-[#b89354] text-xs font-bold font-tajawal  tracking-wide">
            {product.category || "إكسوارات"}
          </Text>
        </View>

        {/* Product name */}
        <View className="items-end">
          <Text className="text-right text-[#201b16] text-base font-medium font-tajawal ">
            {product.name}
          </Text>
        </View>

        {/* Price and cart button */}
        <View className="pt-2 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => {
              addToCart(product, null);
            }}
            className="w-10 h-10 bg-[#b89354] rounded-full justify-center items-center"
          >
            <Ionicons name="add-outline" size={18} color={"#ffffff"} />
            {/* <View className="w-[7.58px] h-[7.58px] bg-white" /> */}
          </TouchableOpacity>
          <Text className="text-right text-[#b89354] text-base font-bold font-work-sans">
            {product.price} {CURRENCY}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;

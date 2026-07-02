import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { IProduct, ProductCardProps } from "../constants/types";
import ChooseColorSizeModal from "./ChooseColorSizeModal";
import { useCart } from "../context/CartContext";
import { useFavoris } from "../context/FavorisContext";

const ProductCard = ({ product }: ProductCardProps) => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();
  const { isLiked, toggleLike } = useFavoris();

  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const isVariable = product?.type === "variable";

  const defaultColor = useMemo(() => {
    if (!isVariable) return null;
    const firstColor =  (product as any)?.colors[0]
    return firstColor.hex ?? null;
  }, [isVariable, product]);

  const defaultSize = useMemo(() => {
    if (!isVariable) return null;
    const firstColor = (product as any)?.colors?.[0];
    return firstColor?.variants?.[0]?.size ?? null;
  }, [isVariable, product]);

  const handleOpenVariableModal = () => {
    // Pre-fill with first available color/size so the modal can be added immediately if desired
    setSelectedColor(defaultColor);
    setSelectedSize(defaultSize ? String(defaultSize) : null);
    setShowModal(true);
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
          className=" aspect-square relative bg-[#fcf9f1] 
        rounded-2xl overflow-hidden"
        >
          <Image
            source={{
              uri: product?.images?.[0] ?? (product as any)?.colors?.[0]?.images?.[0],
            }}
            defaultSource={require("../assets/images/productLoadingImage.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleLike(product as any);
            }}
            className="absolute left-3 top-3"
          >
            {isLiked((product as any)._id) ? (
              <Ionicons name="heart-sharp" size={20} color={"#b89354"} />
            ) : (
              <Ionicons name="heart-outline" size={20} color={"#b89354"} />
            )}
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
              if (!product) return;

              if (product.type === "variable") {
                handleOpenVariableModal();
                return;
              }

              // Simple product: add directly
              addToCart(product as IProduct, null, null);
            }}
            className="w-10 h-10 bg-[#b89354] rounded-full justify-center items-center"
          >
            <Ionicons name="add-outline" size={18} color={"#ffffff"} />
          </TouchableOpacity>

          <Text className="text-right text-[#b89354] text-base font-bold font-work-sans">
            {product.price} {CURRENCY}
          </Text>
        </View>

        <ChooseColorSizeModal
          show={showModal}
          setShow={setShowModal}
          product={(product as any) ?? null}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
        />
      </View>
    </Pressable>
  );
};

export default ProductCard;


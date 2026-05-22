import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { CURRENCY } from "../constants/index";
import { FavorisItemsProps } from "../constants/types";

const FavorisItem = ({ product }: FavorisItemsProps) => {
  console.log(product);
  const imageUri =
    product?.type === "simple"
      ? product?.images?.[0]
      : product?.colors?.[0]?.images?.[0];

  return (
    <View className="self-stretch p-4 bg-white rounded-xl shadow-lg flex-row justify-start items-center gap-4 mb-4">
      {/* Texts */}
      <View className="flex-1 flex-col justify-between items-start">
        <View className="self-stretch flex-col justify-start items-start gap-1">
          <View className="self-stretch flex-row justify-between items-start">
            <TouchableOpacity className="flex-col justify-center items-center">
              <Ionicons name={"heart-sharp"} color={"#b89354"} size={20} />
            </TouchableOpacity>

            <View className="flex-col  justify-start items-end">
              <Text className="text-right text-body text-lg font-body">
                {/* {product?.name} */}
                Hello world!!
              </Text>
            </View>
          </View>

          <View className="self-stretch flex-col justify-start items-end">
            <Text className="text-right text-[#645d59] text-xs font-tajwal font-medium tracking-wide">
              {product?.subtitle}
            </Text>
          </View>
        </View>

        {/* Button + Price */}
        <View className="self-stretch pt-4 flex-col justify-start items-start">
          <View className="self-stretch flex-row justify-between items-end">
            <View className="px-4 py-2 bg-[#b89354] rounded-full flex-row justify-start items-center gap-1">
              <Text className="text-center text-white text-base font-body">
                إضافة للحقيبة
              </Text>
              <SimpleLineIcons name={"handbag"} size={14} color={"#fff"} />
            </View>

            <View className="flex-col justify-start items-end">
              <Text className="text-right text-[#785920] text-base font-body">
                {product?.price} {CURRENCY}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Product image */}
      <View className="w-28 h-32 rounded-lg overflow-hidden">
        <Image
          className="w-28 h-32 rounded-lg"
          source={
            imageUri
              ? { uri: imageUri }
              : require("../assets/images/productLoadingImage.png")
          }
          defaultSource={require("../assets/images/productLoadingImage.png")}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

export default FavorisItem;

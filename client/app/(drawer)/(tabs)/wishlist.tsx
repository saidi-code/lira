import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FavorisItem from "../../../components/FavorisItem";
import Header from "../../../components/Header";
import { useFavoris } from "../../../hooks/useFavoris";
const Wishlist = () => {
  const router = useRouter();
  const { favorisItem, itemsCount } = useFavoris();
  return (
    <SafeAreaView className=" bg-surface flex-1" edges={["top"]}>
      <Header showBack />
      {/* Page Title */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center items-center gap-2 mt-8 mb-6">
          {/* First line */}

          <Text
            className="text-center
         text-primary text-base 
         font-medium font-tajwal uppercase 
          tracking-wider"
          >
            الحقيبة الخاصة بك
          </Text>

          {/* Second line */}

          <Text
            className="text-center text-body text-4xl 
          leading-[43px] font-bold font-jazera"
          >
            المفضلة
          </Text>
        </View>
        {itemsCount <= 0 ? (
          <View
            className="flex-1 mx-4 p-4 items-center justify-center
             bg-canvas rounded-xl border
         border-primary border-dashed"
          >
            <Text className="text-center text-xl text-primary-700 font-jazera mb-4 font-bold">
              أضف لمسة فاخرة إلى حقيبتك
            </Text>
            <Text className="text-primary-500 font-tajwal text-center px-4 mb-6">
              اجعل حقيبتك مليئة بالمنتجات التي تعكس ذوقك الراقي
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/")}
              activeOpacity={0.8}
              className="self-stretch py-5 bg-[#785920] rounded-full shadow-md flex-row justify-center items-center gap-2"
              style={{
                shadowColor: "rgba(120,89,32,0.05)",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 20,
                elevation: 4,
              }}
            >
              {/* Arrow icon (left pointing, rotated 180°) */}

              {/* <Ionicons name="basket-outline" color={"#fff"} size={20} /> */}
              <MaterialCommunityIcons
                name="shopping-search-outline"
                color={"#fff"}
                size={20}
              />
              {/* Button Text */}
              <Text className="text-white text-base leading-6 font-normal text-center">
                أبدء التسوق الأن
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Favoris Items Container
            <View className="m-6">
              {favorisItem.map((item, index) => (
                <FavorisItem
                  key={item.productId || `fav-${index}`}
                  product={item.product as any}
                />
              ))}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Wishlist;

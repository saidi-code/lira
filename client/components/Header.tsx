import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/index";
import { HeaderProps } from "../constants/types";
import { useCart } from "../context/CartContext";
import { useFavoris } from "../context/FavorisContext";
import { DrawerToggleButton } from "@react-navigation/drawer";
import OpenNavMenuBtn from "./OpenNavMenuBtn";
const Header = ({ showSearch = false, showBack = false }: HeaderProps) => {
  const { itemCount } = useCart();
  const { itemsCount: favorisCount } = useFavoris();
  const router = useRouter();
  return (
    <View
      className="h-[80px]  bg-[#FCF9F1] 
    shadow border-b border-primary-100 relative"
    >
      <View className=" flex-1 flex-row items-center  px-4  justify-between ">
        {showBack && (
          <View className="flex-row bg-primary-100 rounded-full px-4 py-2 items-center gap-1">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons
                name="arrow-back-circle-sharp"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
            <Text className="font-tajwal text-xs font-semibold text-primary">
              رجوع
            </Text>
          </View>
        )}

        {showSearch && (
          <View
            className="
         bg-primary/10 rounded-full p-2"
          >
          <OpenNavMenuBtn/>
            {/* <TouchableOpacity>
              <Ionicons
                name="search-outline"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity> */}
          </View>
        )}
        <View className="flex-row gap-4 bg-primary/10 rounded-full px-4 py-2">
          <TouchableOpacity
            className="relative"
            onPress={() => router.navigate("/cart")}
          >
            <Ionicons
              name={itemCount > 0 ? "bag-sharp" : "bag-outline"}
              size={20}
              color={COLORS.primary}
            />
            <View className="absolute -bottom-2 -right-2 bg-accent/80 rounded-full w-5 h-5 items-center justify-center z-10">
              <Text className="text-white  text-[8px] leading-[8px]  font-bold">
                {itemCount}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="relative"
            onPress={() => router.navigate("/(tabs)/wishlist")}
          >
            <Ionicons
              name={favorisCount > 0 ? "heart-sharp" : "heart-outline"}
              size={20}
              color={"#dc2626"}
            />
            <View className="absolute -bottom-2 -right-2 bg-accent/80 rounded-full w-5 h-5 items-center justify-center z-10">
              <Text className="text-white  text-[8px] leading-[8px] font-bold">
                {favorisCount}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      <View className=" absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Image
          style={{
            height: 48,
            width: 48,
          }}
          resizeMode="contain"
          source={require("../assets/images/logo2.png")}
        />
      </View>
    </View>
  );
};

export default Header;

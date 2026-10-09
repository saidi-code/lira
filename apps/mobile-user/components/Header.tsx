import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../constants/index";
import { HeaderProps } from "../constants/types";
import { useCart } from "../hooks/useCart";
import { useFavoris } from "../hooks/useFavoris";
import OpenNavMenuBtn from "./OpenNavMenuBtn";
import { useNotifications } from "../hooks/useNotifications";

const Header = ({ showSearch = false, showBack = false }: HeaderProps) => {
  const { itemCount } = useCart();
  const { itemsCount: favorisCount } = useFavoris();
  const { data: notifications } = useNotifications();
  const notificationCount = notifications?.unreadCount ?? 0;
  const router = useRouter();

  return (
    <View className="h-[80px] bg-[#FCF9F1] border-b border-primary-100 relative">
      <View className="flex-1 flex-row items-center px-4 justify-between">
        {/* LEFT SECTION - Back button OR Nav Menu */}
        <View className="flex-row items-center">
          {showBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.back()}
              className="flex-row bg-primary-100 rounded-full px-4 py-2 items-center gap-1"
            >
              <Ionicons
                name="arrow-back-circle-sharp"
                size={20}
                color={COLORS.primary}
              />
              <Text className="font-tajwal text-xs font-semibold text-primary">
                رجوع
              </Text>
            </TouchableOpacity>
          ) : showSearch ? (
            <View className="bg-primary/10 rounded-full p-2">
              <OpenNavMenuBtn />
            </View>
          ) : (
            <View className="w-[40px]" />
          )}
        </View>

        {/* CENTER - Logo */}
        <View className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image
            style={{ height: 48, width: 48 }}
            resizeMode="contain"
            source={require("../assets/images/logo2.png")}
          />
        </View>

        {/* RIGHT SECTION - Actions */}
        <View className="flex-row items-center gap-2">
          {/* Cart, Wishlist & Notifications grouped */}
          <View className="flex-row items-center bg-primary/10 rounded-full px-3 py-2 gap-3">
            {/* Cart */}
            <TouchableOpacity
              activeOpacity={0.7}
              className="relative"
              onPress={() => router.push("/cart")}
            >
              <Ionicons
                name={itemCount > 0 ? "bag-sharp" : "bag-outline"}
                size={20}
                color={COLORS.primary}
              />
              {itemCount > 0 && (
                <View className="absolute -bottom-2 -right-2 bg-accent/80 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center z-10">
                  <Text className="text-white text-[8px] leading-[8px] font-bold">
                    {itemCount > 99 ? "99+" : itemCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Wishlist */}
            <TouchableOpacity
              activeOpacity={0.7}
              className="relative"
              onPress={() => router.push("/wishlist")}
            >
              <Ionicons
                name={favorisCount > 0 ? "heart-sharp" : "heart-outline"}
                size={20}
                color={"#dc2626"}
              />
              {favorisCount > 0 && (
                <View className="absolute -bottom-2 -right-2 bg-accent/80 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center z-10">
                  <Text className="text-white text-[8px] leading-[8px] font-bold">
                    {favorisCount > 99 ? "99+" : favorisCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notifications */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push("/(drawer)/notifications" as any)}
              className="relative"
            >
              <MaterialIcons
                name={notificationCount ? "notifications" : "notifications-none"}
                size={20}
                color={COLORS.primary}
              />
              {notificationCount > 0 && (
                <View className="absolute -bottom-2 -right-2 bg-accent/80 rounded-full min-w-[18px] h-[18px] px-1 items-center justify-center z-10">
                  <Text className="text-white text-[8px] leading-[8px] font-bold">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Header;

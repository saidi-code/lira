import { COLORS } from "@/constants";
import { useAppColors } from "@/constants/utility";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
export default function AdminLayout() {
  const { user, isLoaded } = useUser();

  const router = useRouter();

  // Header and tab colours come from the theme so the admin area follows
  // light/dark like the shop does (AGENT.md §3.6.3: no hardcoded hex).
  const colors = useAppColors();

  useEffect(() => {
    if (isLoaded && (!user || user.publicMetadata?.role !== "admin")) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user || user.publicMetadata?.role !== "admin") return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.inactive,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.replace("/")}
            className="mr-4 flex-row items-center"
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
            <Text className="ml-1 text-primary font-medium">Exit</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

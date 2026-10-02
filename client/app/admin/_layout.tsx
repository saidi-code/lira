import { COLORS } from "@/constants";
import { useAppColors } from "@/constants/utility";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { usePermissions } from "../../hooks/usePermissions";

export default function AdminLayout() {
  const { isLoaded, isStaff, can } = usePermissions();

  const router = useRouter();

  // Header and tab colours come from the theme so the admin area follows
  // light/dark like the shop does (AGENT.md §3.6.3: no hardcoded hex).
  const colors = useAppColors();

  useEffect(() => {
    // Only once Clerk has resolved: `role` is null until then, and redirecting on
    // that would bounce a signed-in manager out during the first render.
    if (isLoaded && !isStaff) {
      router.replace("/");
    }
  }, [isLoaded, isStaff, router]);

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isStaff) return null;

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
      {/*
        Tabs are filtered by capability, and `href: null` removes the tab rather
        than just hiding its icon — the route stays registered but is guarded by
        its own screen, so a deep link cannot walk past this.

        The old gate was `role !== "admin"`, which hid the inventory and transfer
        tools from the `manager` and `warehouse_staff` roles the server had
        already opened to. A manager could call every inventory endpoint
        successfully and never see a single one of them.
      */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          href: can("dashboard") ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Stock",
          href: can("inventory.read") ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          href: can("orders") ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          href: can("products") ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

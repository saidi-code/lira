import { COLORS } from "@/constants";
import { useAuth } from "@clerk/clerk-expo";
import { ADMIN_TABS, type AdminTabName } from "@/constants/adminTabs";
import { useAppColors } from "@/constants/utility";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useEffect, type ComponentProps } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { usePermissions } from "../../hooks/usePermissions";

type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * Icons are presentation, so they stay here rather than in `constants/adminTabs`
 * — that file is deliberately dependency-free so it can be tested without a
 * bundler. Typed by `AdminTabName`, so adding a tab without an icon fails to
 * compile instead of rendering a blank slot.
 */
const TAB_ICON: Record<AdminTabName, IconName> = {
  inventory: "cube-outline",
  purchasing: "cart-outline",
  transfers: "swap-horizontal-outline",
  announcements: "notifications-outline",
};

export default function AdminLayout() {
  const { isLoaded, isStaff, can } = usePermissions();
  const { signOut } = useAuth();

  const router = useRouter();

  // Header and tab colours come from the theme so the admin area follows
  // light/dark like the shop does (AGENT.md §3.6.3: no hardcoded hex).
  const colors = useAppColors();

  useEffect(() => {
    // Only once Clerk has resolved: `role` is null until then, and redirecting on
    // that would bounce a signed-in manager out during the first render.
    // Non-staff land on /(staff)/denied, which explains why and offers sign-out —
    // the old `router.replace("/")` pointed at the shop, which does not exist in
    // this app, so it rendered an empty route.
    if (isLoaded && !isStaff) {
      router.replace("/(staff)/denied");
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
      initialRouteName="inventory"
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
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/signIn");
            }}
            className="mr-4 flex-row items-center"
          >
            <Ionicons name="log-out-outline" size={24} color={COLORS.primary} />
            <Text className="ml-1 text-primary font-medium">Sign out</Text>
          </TouchableOpacity>
        ),
      }}
    >
      {/*
        Every tab is declared, and the ones this role cannot use get `href: null`.
        Declaring only the permitted ones would not work: expo-router registers a
        tab for any route file it finds, so the rest would reappear as tabs. The
        list itself lives in `constants/adminTabs.ts` so that "which tabs does a
        manager get?" is answerable by a test rather than by signing in.

        Hiding a tab is not gating it — `href: null` leaves the route reachable by
        deep link, which is what `RequireCapability` on each screen is for.
      */}
      {ADMIN_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: can(tab.capability) ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICON[tab.name]} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

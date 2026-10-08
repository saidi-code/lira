// components/admin/RequireCapability.tsx
// ==========================================
//   Refuses to mount an admin screen the signed-in role cannot use.
//
// `href: null` on a `Tabs.Screen` hides the tab; it does not unregister the
// route. A manager or warehouse_staff member is already inside `/admin`, so a
// deep link still reaches any screen, which then fires an API call the server
// answers with 403 and shows a raw error toast.
//
// Wrapping means the screen never mounts, so the doomed request is never made
// and the reason is stated in words. It is deliberately a wrapper rather than an
// early `return` inside each screen: an early return has to sit after every hook
// in the file, and several of these screens have hooks well past the top —
// getting that wrong is a runtime crash, not a type error.
//
// This is UX, not security. `authorize(...)` on the server route is the boundary,
// and nothing here changes what the server will answer.
// ==========================================
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { COLORS } from "@/constants";
import type { Capability } from "@/constants/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "expo-router";
import type { ReactNode } from "react";

/**
 * Why the role is being turned away, phrased for the person reading it. Mirrors
 * `CAPABILITY_ROLES` by hand; a missing entry falls back to a generic line rather
 * than rendering "undefined".
 */
const REASON: Partial<Record<Capability, string>> = {
  dashboard: "The dashboard is limited to admins.",
  products: "Managing products is limited to admins.",
  orders: "Managing orders is limited to admins.",
  users: "Managing staff is limited to admins.",
  "inventory.read": "Stock is limited to admins, managers and warehouse staff.",
  "inventory.adjust": "Adjusting stock is limited to admins and managers.",
  purchasing: "Purchasing is limited to admins and managers.",
  suppliers: "Suppliers are limited to admins and managers.",
  warehouses: "Warehouses are limited to admins and managers.",
  transfers: "Transfers are limited to admins, managers and warehouse staff.",
};

/** The refusal screen. Shared so every guarded route says the same thing. */
export function CapabilityDenied({ capability }: { capability: Capability }) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Text className="text-primary font-bold text-lg text-center">
        Not available for your role
      </Text>
      <Text className="text-secondary text-sm mt-2 text-center">
        {REASON[capability] ?? "Your role does not have access to this screen."}
      </Text>
      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-6 px-6 py-3 rounded-full bg-primary"
      >
        <Text className="text-white font-bold">Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

export function RequireCapability({
  capability,
  children,
}: {
  capability: Capability;
  children: ReactNode;
}) {
  const { isLoaded, can } = usePermissions();

  // Only reachable if this is rendered outside the admin layout, which already
  // gates on `isLoaded`. A spinner rather than a denial, because "not yet known"
  // and "not allowed" are different answers and only one of them is true.
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!can(capability)) return <CapabilityDenied capability={capability} />;

  return <>{children}</>;
}

export default RequireCapability;

// app/admin/purchasing/_layout.tsx
import { COLORS } from "@/constants";
import { Stack } from "expo-router";

export default function PurchasingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Purchase orders" }} />
      <Stack.Screen name="suppliers" options={{ title: "Suppliers" }} />
      <Stack.Screen name="new" options={{ title: "New order", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Order" }} />
    </Stack>
  );
}
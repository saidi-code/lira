// app/admin/inventory/_layout.tsx
import { COLORS } from "@/constants";
import { Stack } from "expo-router";

export default function InventoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Stock" }} />
      <Stack.Screen name="movements" options={{ title: "Movement ledger" }} />
    </Stack>
  );
}

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
      {/*
        Registering a screen here only sets its header — it does not gate it, so
        `adjust` is listed for everyone and the screen refuses for itself via
        `RequireCapability`. A warehouse_staff member can read the ledger but gets
        a 403 on POST /inventory/adjust, so the form must not open for them.
      */}
      <Stack.Screen name="adjust" options={{ title: "Adjust stock" }} />
    </Stack>
  );
}
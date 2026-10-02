// app/admin/inventory/_layout.tsx
import { COLORS } from "@/constants";
import { Stack } from "expo-router";

import { usePermissions } from "../../../hooks/usePermissions";

export default function InventoryLayout() {
  const { can } = usePermissions();

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
        The screen is only registered for roles the server lets adjust. A
        warehouse_staff member can read the ledger but gets a 403 on POST
        /inventory/adjust, so offering them the form would be a dead end.
      */}
      {can("inventory.adjust") && (
        <Stack.Screen name="adjust" options={{ title: "Adjust stock" }} />
      )}
    </Stack>
  );
}
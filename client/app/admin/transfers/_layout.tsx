// app/admin/transfers/_layout.tsx
import { COLORS } from "@/constants";
import { Stack } from "expo-router";

export default function TransfersLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Transfers" }} />
      <Stack.Screen name="warehouses" options={{ title: "Warehouses" }} />
      <Stack.Screen
        name="new"
        options={{ title: "Move stock", presentation: "modal" }}
      />
    </Stack>
  );
}
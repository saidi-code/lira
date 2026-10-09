// app/index.tsx — Lyra Admin entry
// ==========================================
// Everything real lives under `/admin/inventory` or `/(auth)/signIn`.
// This file only decides which one to show first: the root Stack has no
// `index` screen of its own, so without this redirect `router.replace("/")`
// from the admin layout's Exit button would land on an empty route.
import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { COLORS } from "@/constants";

export default function AdminEntry() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Redirect href={isSignedIn ? "/admin/inventory" : "/(auth)/signIn"} />;
}

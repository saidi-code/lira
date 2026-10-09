// app/(staff)/denied.tsx — Lyra Admin
// ==========================================
// Where accounts assigned to another role land. This app is manager-only.
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";
import { normalizeRole } from "@/constants/permissions";

export default function StaffDenied() {
  const { isLoaded, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const role = normalizeRole(user?.publicMetadata?.role);

  const onSignOut = async () => {
    await signOut();
    router.replace("/(auth)/signIn");
  };

  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Text className="text-primary font-bold text-lg text-center">
        Manager access only
      </Text>
      <Text className="text-secondary text-sm mt-2 text-center">
        {role
          ? `This account is signed in as "${role}". The manager app is for manager accounts.`
          : "This account has no role assigned."}{" "}
        Sign in with the account assigned to this app, or use the app for your role.
      </Text>
      <TouchableOpacity
        onPress={onSignOut}
        className="mt-6 px-6 py-3 rounded-full bg-primary"
      >
        <Text className="text-white font-bold">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

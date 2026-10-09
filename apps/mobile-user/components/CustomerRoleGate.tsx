import { useAuth, useUser } from "@clerk/clerk-expo";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants";
import { unregisterPushDevice } from "@/config/pushDevice";

/** The customer app is available to guests and customer accounts only. */
export default function CustomerRoleGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, user } = useUser();
  const { signOut, getToken } = useAuth();

  const handleSignOut = async () => {
    await unregisterPushDevice(await getToken()).catch(() => undefined);
    await signOut();
  };

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Public browsing remains available to signed-out guests. A signed-in staff
  // account belongs in its role-specific application.
  if (!user || user.publicMetadata?.role === "user") return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Text className="text-primary text-lg font-bold text-center">
        This account belongs in another Lyra app
      </Text>
      <Text className="mt-3 text-center text-secondary">
        Sign out, then open the app assigned to your role.
      </Text>
      <TouchableOpacity
        onPress={() => void handleSignOut()}
        className="mt-6 rounded-full bg-primary px-6 py-3"
      >
        <Text className="font-bold text-white">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

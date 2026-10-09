import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function WarehouseDenied() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const role = user?.publicMetadata?.role;

  return (
    <View className="flex-1 items-center justify-center bg-surface px-8">
      <Text className="text-primary text-lg font-bold text-center">
        Warehouse staff access only
      </Text>
      <Text className="mt-3 text-center text-secondary">
        {typeof role === "string"
          ? `This account is assigned to the ${role} role. Open the Lira app for your role.`
          : "This account has no assigned role. Ask an administrator for access."}
      </Text>
      <TouchableOpacity
        onPress={async () => {
          await signOut();
          router.replace("/(auth)/signIn");
        }}
        className="mt-6 rounded-full bg-primary px-6 py-3"
      >
        <Text className="font-bold text-white">Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

// app/(staff)/denied.tsx — Lyra Admin
// ==========================================
// Where non-staff roles land. A customer who signs into the staff app with a
// valid session is authenticated but not authorised: there is no dashboard tab
// for them, so this explains why and offers sign-out (which returns them to
// sign-in via the root StaffGate). Without this, the admin layout's old
// `router.replace("/")` sent them to the shop route — which does not exist in
// this app — and rendered an empty screen.
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
        Staff access only
      </Text>
      <Text className="text-secondary text-sm mt-2 text-center">
        {role
          ? `This account is signed in as "${role}", which has no backoffice access.`
          : "This account has no staff role assigned."}{" "}
        Ask an admin to set a staff role in Clerk, or sign in with a staff account.
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

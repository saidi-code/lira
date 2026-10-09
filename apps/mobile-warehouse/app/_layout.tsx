import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
// Avoid token-cache which pulls expo-auth-session -> expo-crypto AES on Expo Go
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../constants/config";
import { SettingsProvider } from "../context/SettingsContext";
import { COLORS } from "../constants";
import { ActivityIndicator, View } from "react-native";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      cacheTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function WarehouseGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const isWarehouseStaff = user?.publicMetadata?.role === "warehouse_staff";

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;
    const inAuth = segments[0] === "(auth)";
    const inDenied = segments[0] === "(staff)" && segments[1] === "denied";

    if (!isSignedIn && !inAuth) router.replace("/(auth)/signIn");
    else if (isSignedIn && !isWarehouseStaff && !inDenied) router.replace("/(staff)/denied");
    else if (
      isSignedIn &&
      isWarehouseStaff &&
      (inAuth || (segments[0] !== "admin" && segments[0] !== "settings"))
    ) {
      router.replace("/admin");
    }
  }, [isLoaded, isUserLoaded, isSignedIn, isWarehouseStaff, segments, router]);

  const inAuth = segments[0] === "(auth)";
  const inDenied = segments[0] === "(staff)" && segments[1] === "denied";
  const canRender =
    (isSignedIn && isWarehouseStaff &&
      (segments[0] === "admin" || segments[0] === "settings")) ||
    (!isSignedIn && inAuth) ||
    (isSignedIn && !isWarehouseStaff && inDenied);

  if (!isLoaded || !isUserLoaded || !canRender) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {

  const [fontsLoaded] = useFonts({
    "jazera-bold": require("../assets/fonts/Al-Jazeera-Arabic-Bold.ttf"),
    "tajwal-medium": require("../assets/fonts/Tajawal-Medium.ttf"),
    "arabic-body": require("../assets/fonts/IBMPlexSansArabic-Regular.ttf"),
  });
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
    if (!fontsLoaded) return;
  }, [fontsLoaded]);
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
        <SettingsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <WarehouseGate>
            <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(staff)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack>
          </WarehouseGate>
        </GestureHandlerRootView>
        <Toast config={toastConfig} />
        </SettingsProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

// app/_layout.tsx — Lyra Admin (mobile-admin)
// ==========================================
// Staff-only shell. Signed-out staff land on `/(auth)/signIn`; signed-in
// staff land on `/admin/inventory` (the default staff tab). There is deliberately no
// drawer, no shop tabs, no cart modal, no SettingsProvider — those are
// consumer concerns that live in `mobile/`, not here.
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../constants/config";
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

/**
 * Staff gate. `useAuth().isLoaded` is false until Clerk resolves the session —
 * redirecting before that would bounce a signed-in manager to sign-in on every
 * cold start. `useSegments()` tells us whether we are already inside `(auth)`,
 * so we never push a signed-out user from sign-in back to sign-in.
 */
function StaffGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const segments = useSegments();
  const isManager = user?.publicMetadata?.role === "manager";

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;
    const inAuth = segments[0] === "(auth)";
    const inDenied = segments[0] === "(staff)" && segments[1] === "denied";
    if (!isSignedIn && !inAuth) router.replace("/(auth)/signIn");
    else if (isSignedIn && inAuth) router.replace(isManager ? "/admin/inventory" : "/(staff)/denied");
    else if (isSignedIn && isManager && inDenied) router.replace("/admin/inventory");
    else if (isSignedIn && !isManager && !inDenied) router.replace("/(staff)/denied");
  }, [isLoaded, isUserLoaded, isSignedIn, isManager, segments, router]);

  const inAuth = segments[0] === "(auth)";
  const inDenied = segments[0] === "(staff)" && segments[1] === "denied";
  const canRender =
    (isSignedIn && isManager && !inDenied) ||
    (!isSignedIn && inAuth) ||
    (isSignedIn && !isManager && inDenied);

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
  }, [fontsLoaded]);

  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StaffGate>
            <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(staff)" options={{ headerShown: false }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack>
          </StaffGate>
        </GestureHandlerRootView>
        <Toast config={toastConfig} />
      </ClerkProvider>
    </QueryClientProvider>
  );
}


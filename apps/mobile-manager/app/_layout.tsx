// app/_layout.tsx — Lyra Admin (mobile-admin)
// ==========================================
// Staff-only shell. Signed-out staff land on `/(auth)/signIn`; signed-in
// staff land on `/admin` (the dashboard tab). There is deliberately no
// drawer, no shop tabs, no cart modal, no SettingsProvider — those are
// consumer concerns that live in `mobile/`, not here.
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../constants/config";
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
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!isLoaded) return;
    const inAuth = segments[0] === "(auth)";
    if (!isSignedIn && !inAuth) router.replace("/(auth)/signIn");
    else if (isSignedIn && inAuth) router.replace("/admin");
  }, [isLoaded, isSignedIn, segments, router]);

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


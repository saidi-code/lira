import { ClerkProvider } from "@clerk/clerk-expo";
// Avoid token-cache which pulls expo-auth-session -> expo-crypto AES on Expo Go
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { toastConfig } from "../constants/config";
import LoginOrRegisterModal from "../components/LoginOrRegisterModal";
import { useAuthModal } from "../hooks/useCart";
import { SettingsProvider } from "../context/SettingsContext";
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

function AuthModalContainer() {
  const { isOpen, close } = useAuthModal();
  return <LoginOrRegisterModal show={isOpen} setShow={close} />;
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
          <Stack screenOptions={{ headerShown: false, navigationBarHidden: true }}>
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          </Stack>
        </GestureHandlerRootView>
        <AuthModalContainer />
        <Toast config={toastConfig} />
        </SettingsProvider>
      </ClerkProvider>
    </QueryClientProvider>
  );
}

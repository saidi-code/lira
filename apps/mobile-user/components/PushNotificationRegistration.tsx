import { useAuth, useUser } from "@clerk/clerk-expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useSettings } from "../context/SettingsContext";
import { notificationApi } from "../config/notificationApi";
import { PUSH_TOKEN_STORAGE_KEY, unregisterPushDevice } from "../config/pushDevice";

// Expo Go no longer supports remote push notifications on Android (SDK 53+).
// Keep the module out of its bundle-time import path so Expo Go can still be
// used for the rest of the customer app without expo-notifications throwing.
const isExpoGo = Constants.executionEnvironment === "storeClient";

export default function PushNotificationRegistration() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const { settings, hydrated, setPhoneNotifications } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (isExpoGo) return;

    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    void import("expo-notifications").then((Notifications) => {
      if (cancelled) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as { productId?: string };
        if (data.productId) router.push(`/product/${data.productId}` as any);
        else router.push("/(drawer)/notifications" as any);
      });
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!hydrated || !isLoaded) return;
    let cancelled = false;

    const syncDevice = async () => {
      if (isExpoGo) return;

      const sessionToken = isSignedIn ? await getToken() : null;

      if (!settings.phoneNotifications || !isSignedIn || user?.publicMetadata?.role !== "user" || !sessionToken) {
        if (isSignedIn && sessionToken) {
          await unregisterPushDevice(sessionToken).catch(() => undefined);
        }
        return;
      }

      if (!Device.isDevice) {
        setPhoneNotifications(false);
        return;
      }

      const Notifications = await import("expo-notifications");
      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
      if (permission.status !== "granted") {
        setPhoneNotifications(false);
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("promotions", {
          name: "Promotions and new products",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const projectId =
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn("Set expo.extra.eas.projectId to enable push notifications.");
        return;
      }

      const expoToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (cancelled) return;
      await notificationApi.registerDevice(
        expoToken,
        Platform.OS === "ios" ? "ios" : "android",
        sessionToken
      );
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoToken);
    };

    syncDevice().catch((error) => console.warn("Push registration failed:", error));
    return () => {
      cancelled = true;
    };
  }, [getToken, hydrated, isLoaded, isSignedIn, settings.phoneNotifications, setPhoneNotifications, user?.publicMetadata?.role]);

  return null;
}

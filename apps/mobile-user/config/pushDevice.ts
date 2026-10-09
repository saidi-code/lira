import AsyncStorage from "@react-native-async-storage/async-storage";
import { notificationApi } from "./notificationApi";

export const PUSH_TOKEN_STORAGE_KEY = "@lyra/push-token/v1";

export async function unregisterPushDevice(authToken?: string | null) {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!token || !authToken) return;
  await notificationApi.removeDevice(token, authToken);
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
}

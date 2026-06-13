import axios from "axios";
import { Platform } from "react-native";

// Platform fallback
const LOCAL_API_URL = Platform.select({
  // android: "http://192.168.80.1:3000/api/v1",
  android: "https://lira-lilac.vercel.app/api/v1",
  ios: "http://192.168.80.1:3000/api/v1",
  default: "http://localhost:3000/api/v1",
});

// Allow override from Expo env (preferred)
const baseURL =
  (process as any)?.env?.EXPO_PUBLIC_API_URL ?? LOCAL_API_URL;


const api = axios.create({
  baseURL,
});

export default api;


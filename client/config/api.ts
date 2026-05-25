import axios from "axios";
import { Platform } from "react-native";
const LOCAL_API_URL = Platform.select({
  // android: "http://192.168.80.1:3000/api/v1",
  android: "https://lira-lilac.vercel.app/api/v1",
  ios: "http://192.168.80.1:3000/api/v1",
  default: "http://localhost:3000/api/v1",
});
const api = axios.create({
  baseURL: LOCAL_API_URL,
});
export default api;

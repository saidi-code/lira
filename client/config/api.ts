import axios, { AxiosRequestConfig } from "axios";
import { Platform } from "react-native";

const LOCAL_API_URL = Platform.select({
  android: "https://lira-lilac.vercel.app/api/v1",
  ios: "https://lira-lilac.vercel.app/api/v1",
  default: "https://lira-lilac.vercel.app/api/v1",
});

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || LOCAL_API_URL || "https://lira-lilac.vercel.app/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  get: async <T = any>(endpoint: string, options?: { signal?: AbortSignal; params?: Record<string, any>; headers?: Record<string, string> }): Promise<T> => {
    const config: AxiosRequestConfig = {
      params: options?.params,
      signal: options?.signal,
      headers: options?.headers,
    };
    const response = await apiClient.get<T>(endpoint, config);
    return response.data;
  },
  post: async <T = any>(endpoint: string, data?: any, options?: { signal?: AbortSignal; headers?: Record<string, string> }): Promise<T> => {
    const response = await apiClient.post<T>(endpoint, data, {
      signal: options?.signal,
      headers: options?.headers,
    });
    return response.data;
  },
  put: async <T = any>(endpoint: string, data?: any, options?: { signal?: AbortSignal; headers?: Record<string, string> }): Promise<T> => {
    const response = await apiClient.put<T>(endpoint, data, {
      signal: options?.signal,
      headers: options?.headers,
    });
    return response.data;
  },
  delete: async <T = any>(endpoint: string, options?: { signal?: AbortSignal; params?: Record<string, any>; headers?: Record<string, string> }): Promise<T> => {
    const response = await apiClient.delete<T>(endpoint, {
      params: options?.params,
      signal: options?.signal,
      headers: options?.headers,
    });
    return response.data;
  },
};

export default apiClient;



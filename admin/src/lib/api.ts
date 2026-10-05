import axios, { type AxiosRequestConfig } from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL || "https://lira-lilac.vercel.app/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: { total: number; page: number; pages?: number; limit?: number };
  total?: number;
  page?: number;
  pages?: number;
};

export async function request<T>(
  method: "get" | "post" | "put" | "delete",
  path: string,
  token?: string | null,
  body?: unknown,
  params?: Record<string, unknown>
): Promise<T> {
  const config: AxiosRequestConfig = {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  };
  const res =
    method === "get"
      ? await apiClient.get<T>(path, config)
      : method === "delete"
        ? await apiClient.delete<T>(path, config)
        : method === "post"
          ? await apiClient.post<T>(path, body, config)
          : await apiClient.put<T>(path, body, config);
  return res.data;
}

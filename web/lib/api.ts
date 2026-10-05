import axios, { type AxiosRequestConfig } from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://lira-lilac.vercel.app/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

type Options = {
  token?: string | null;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
};

const withAuth = (options?: Options): AxiosRequestConfig => ({
  params: options?.params,
  headers: {
    ...options?.headers,
    ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
  },
});

export const api = {
  get: async <T>(path: string, options?: Options) => {
    const { data } = await apiClient.get<T>(path, withAuth(options));
    return data;
  },
  post: async <T>(path: string, body?: unknown, options?: Options) => {
    const { data } = await apiClient.post<T>(path, body, withAuth(options));
    return data;
  },
  put: async <T>(path: string, body?: unknown, options?: Options) => {
    const { data } = await apiClient.put<T>(path, body, withAuth(options));
    return data;
  },
  delete: async <T>(path: string, options?: Options) => {
    const { data } = await apiClient.delete<T>(path, withAuth(options));
    return data;
  },
};

export type Envelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit?: number;
    totalPages?: number;
    pages?: number;
  };
};

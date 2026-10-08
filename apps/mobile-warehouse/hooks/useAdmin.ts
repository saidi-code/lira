// hooks/useAdmin.ts
// ==========================================
// Dashboard stats and user/role administration (server §10, admin-only).
// ==========================================
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-native-toast-message";
import {
  adminApi,
  USER_ROLES,
  type AdminStats,
  type AdminUser,
  type UserRole,
} from "../config/adminApi";
import type { Pagination } from "../config/orderApi";

export { USER_ROLES };
export type { UserRole };

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: (params?: { page?: number; limit?: number }) =>
    [...adminKeys.all, "users", params ?? {}] as const,
};

const EMPTY: Pagination = { total: 0, page: 1, pages: 1 };

const messageFrom = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message ?? fallback;
};

export function useAdminStats() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<AdminStats | undefined, Error>({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const token = await getToken();
      return adminApi.stats(token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60,
  });

  return { ...query, stats: query.data };
}

export function useAdminUsers(params?: { page?: number; limit?: number }) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ rows: AdminUser[]; pagination: Pagination }, Error>({
    queryKey: adminKeys.users(params),
    queryFn: async () => {
      const token = await getToken();
      return adminApi.users(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60,
    keepPreviousData: true,
  });

  return {
    ...query,
    users: query.data?.rows ?? [],
    pagination: query.data?.pagination ?? EMPTY,
  };
}

/**
 * Changes a user's role.
 *
 * Worth knowing before using it: the Clerk webhook re-syncs `role` from
 * `publicMetadata` on the next sign-in, and a metadata role that is *present*
 * overwrites whatever was set here. To make a change stick, update Clerk's
 * public metadata too.
 */
export function useSetUserRole() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; role: UserRole }) => {
      const token = await getToken();
      return adminApi.setRole(input.userId, input.role, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      toast.show({ type: "successToast", text2: res.message ?? "Role updated", topOffset: 100 });
    },
    onError: (error) => {
      // 409 here is specifically "you cannot remove your own admin role".
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not update role"), topOffset: 100 });
    },
  });
}
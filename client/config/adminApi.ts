// config/adminApi.ts
// ==========================================
// Dashboard stats and user administration (server §10, admin-only).
//
// Roles here are the same list the server validates against. Clerk's
// `publicMetadata.role` is the upstream source the webhook syncs from, so a
// change made here is local-only until Clerk is updated too — which the hook
// layer makes explicit.
// ==========================================
import { api } from "./api";
import type { Pagination } from "./orderApi";

/** Mirrors `USER_ROLES` in `server/models/User.ts`. */
export type UserRole =
  | "user"
  | "admin"
  | "manager"
  | "cashier"
  | "warehouse_staff";

export const USER_ROLES: readonly UserRole[] = [
  "user",
  "admin",
  "manager",
  "cashier",
  "warehouse_staff",
];

export interface AdminUser {
  _id: string;
  name: string;
  email?: string;
  image?: string;
  role: UserRole;
  clerkId?: string;
  createdAt?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  revenue?: { total: number };
  recentOrders?: unknown[];
}

export interface AdminResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  data?: T | T[];
}

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export const adminApi = {
  /** GET /admin/stats */
  stats: async (token?: string | null): Promise<AdminStats | undefined> => {
    const res = await api.get<AdminResponse<AdminStats>>("/admin/stats", {
      headers: authHeaders(token),
    });
    return Array.isArray(res.data) ? res.data[0] : res.data;
  },

  /** GET /admin/users — paginated. */
  users: async (
    params?: { page?: number; limit?: number },
    token?: string | null
  ): Promise<{ rows: AdminUser[]; pagination: Pagination }> => {
    const res = await api.get<AdminResponse<AdminUser>>("/admin/users", {
      params,
      headers: authHeaders(token),
    });
    return {
      rows: Array.isArray(res.data) ? res.data : res.data ? [res.data] : [],
      pagination: {
        total: res.total ?? 0,
        page: res.page ?? 1,
        pages: res.pages ?? 1,
      },
    };
  },

  /**
   * PUT /admin/users/:id/role
   *
   * 400 on an unknown role; 409 if an admin tries to demote themselves. The next
   * sign-in re-syncs from Clerk, so a role set here lasts only until Clerk's
   * `publicMetadata` says otherwise.
   */
  setRole: async (id: string, role: UserRole, token?: string | null) => {
    const res = await api.put<AdminResponse<AdminUser>>(
      `/admin/users/${id}/role`,
      { role },
      { headers: authHeaders(token) }
    );
    return res;
  },
};
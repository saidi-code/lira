import { api } from "./api";

export type PromotionNotification = {
  _id: string;
  type: "promotion" | "new_product";
  title: string;
  body: string;
  productId?: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  data: PromotionNotification[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const authHeaders = (token?: string | null) =>
  token ? { Authorization: `Bearer ${token}` } : undefined;

export const notificationApi = {
  list: (token?: string | null) =>
    api.get<NotificationListResponse>("/notifications/my", {
      headers: authHeaders(token),
      params: { limit: 50 },
    }),
  markRead: (id: string, token?: string | null) =>
    api.patch(`/notifications/${id}/read`, {}, { headers: authHeaders(token) }),
  registerDevice: (token: string, platform: "ios" | "android", authToken?: string | null) =>
    api.post("/notifications/push-device", { token, platform }, { headers: authHeaders(authToken) }),
  removeDevice: (token: string, authToken?: string | null) =>
    api.delete("/notifications/push-device", {
      headers: authHeaders(authToken),
      params: { token },
    }),
};

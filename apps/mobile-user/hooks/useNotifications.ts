import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi, type NotificationListResponse } from "../config/notificationApi";

export const notificationKeys = {
  all: ["notifications"] as const,
  mine: (userId?: string) => [...notificationKeys.all, "mine", userId ?? "guest"] as const,
};

export function useNotifications() {
  const { getToken, isSignedIn, userId } = useAuth();
  return useQuery<NotificationListResponse, Error>({
    queryKey: notificationKeys.mine(userId ?? undefined),
    queryFn: async () => notificationApi.list(await getToken()),
    enabled: Boolean(isSignedIn),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => notificationApi.markRead(id, await getToken()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

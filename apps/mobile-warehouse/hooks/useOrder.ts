import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-native-toast-message";
import {
  orderApi,
  BackendOrder,
  CreateOrderInput,
  OrderQueryParams,
  OrderStatus,
  Pagination,
  PaymentStatus,
} from "../config/orderApi";
import { openAuthModal,cartKeys } from "../hooks/useCart";

import { addressKeys } from "../hooks/useAddress";

// ==========================================
// 1. Query Keys
// ==========================================
export const orderKeys = {
  all: ["orders"] as const,
  my: (params?: OrderQueryParams) =>
    [...orderKeys.all, "my", params ?? {}] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  admin: (params?: OrderQueryParams) =>
    [...orderKeys.all, "admin", params ?? {}] as const,
};

const EMPTY_PAGINATION: Pagination = { total: 0, page: 1, pages: 1 };

// ==========================================
// 2. Query Hook: useMyOrdersQuery (paginated)
// ==========================================
export function useMyOrdersQuery(params?: OrderQueryParams) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ orders: BackendOrder[]; pagination: Pagination }, Error>({
    queryKey: orderKeys.my(params),
    queryFn: async () => {
      if (!isSignedIn) {
        return { orders: [], pagination: EMPTY_PAGINATION };
      }
      const token = await getToken();
      return orderApi.getMyOrders(token, params);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true, // smooth pagination
  });

  return {
    ...query,
    orders: query.data?.orders ?? [],
    pagination: query.data?.pagination ?? EMPTY_PAGINATION,
    orderCount: query.data?.pagination.total ?? 0,
  };
}

// ==========================================
// 3. Query Hook: useAllOrdersQuery (admin, paginated)
// ==========================================
export function useAllOrdersQuery(params?: OrderQueryParams) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ orders: BackendOrder[]; pagination: Pagination }, Error>({
    queryKey: orderKeys.admin(params),
    queryFn: async () => {
      if (!isSignedIn) {
        return { orders: [], pagination: EMPTY_PAGINATION };
      }
      const token = await getToken();
      return orderApi.getAllOrders(token, params);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  return {
    ...query,
    orders: query.data?.orders ?? [],
    pagination: query.data?.pagination ?? EMPTY_PAGINATION,
  };
}

// ==========================================
// 4. Query Hook: useOrderByIdQuery
// ==========================================
export function useOrderByIdQuery(orderId?: string) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendOrder | null, Error>({
    queryKey: orderKeys.detail(orderId ?? ""),
    queryFn: async () => {
      if (!isSignedIn || !orderId) return null;
      const token = await getToken();
      return orderApi.getOrderById(orderId, token);
    },
    enabled: Boolean(isSignedIn && orderId),
    staleTime: 1000 * 60 * 2,
  });

  return { ...query, order: query.data ?? null };
}

// ==========================================
// 5. Mutation Hook: useCreateOrder
// ==========================================
export interface CreateOrderVariables {
  payload: CreateOrderInput;
  /** Replayed by the API as `Idempotency-Key`; see newIdempotencyKey(). */
  idempotencyKey?: string | null;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({
      payload,
      idempotencyKey,
    }: CreateOrderVariables) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return orderApi.createOrder(payload, token, idempotencyKey);
    },
    onSuccess: (order) => {
      // Invalidate all paginated "my" queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart() });
      queryClient.invalidateQueries({ queryKey: addressKeys.userAddresses() });

      toast.show({
        type: "successToast",
        text2: `تم إنشاء الطلب ${order?.orderNumber ?? ""}`,
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء إنشاء الطلب";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useCreateOrder error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 6. Mutation Hook: useCancelOrder
// ==========================================
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return orderApi.cancelOrder(orderId, token);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      if (order?._id) {
        queryClient.invalidateQueries({
          queryKey: orderKeys.detail(order._id),
        });
      }
      toast.show({
        type: "successToast",
        text2: "تم إلغاء الطلب بنجاح",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء إلغاء الطلب";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useCancelOrder error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 7. Mutation Hook: useUpdateOrderStatus (admin)
// ==========================================
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({
      orderId,
      orderStatus,
      paymentStatus,
    }: {
      orderId: string;
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
    }) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return orderApi.updateOrderStatus(
        orderId,
        { orderStatus, paymentStatus },
        token
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.show({
        type: "successToast",
        text2: "تم تحديث حالة الطلب",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء تحديث الطلب";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
    },
  });
}

// ==========================================
// 8. Unified useOrder Hook
// ==========================================
export function useOrder(params?: OrderQueryParams, orderId?: string) {
  const { isSignedIn } = useAuth();
  const myOrdersQuery = useMyOrdersQuery(params);
  const orderByIdQuery = useOrderByIdQuery(orderId);
  const createOrderMutation = useCreateOrder();
  const cancelOrderMutation = useCancelOrder();

  const loading =
    myOrdersQuery.isLoading ||
    orderByIdQuery.isLoading ||
    createOrderMutation.isLoading ||
    cancelOrderMutation.isLoading;

  const createOrder = useCallback(
    async (payload: CreateOrderInput, idempotencyKey?: string | null) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      return createOrderMutation.mutateAsync({ payload, idempotencyKey });
    },
    [isSignedIn, createOrderMutation]
  );

  const cancelOrder = useCallback(
    async (id: string) => {
      if (!isSignedIn || !id) return;
      return cancelOrderMutation.mutateAsync(id);
    },
    [isSignedIn, cancelOrderMutation]
  );

  return {
    // Data
    orders: myOrdersQuery.orders,
    pagination: myOrdersQuery.pagination,
    orderCount: myOrdersQuery.orderCount,
    order: orderByIdQuery.order,
    loading,
    isLoading: loading,

    // Actions
    createOrder,
    cancelOrder,
    refetch: myOrdersQuery.refetch,

    // Raw mutations
    createOrderMutation,
    cancelOrderMutation,

    // Auth modal trigger
    openAuthModal,
  };
}

export default useOrder;
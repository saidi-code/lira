// hooks/usePurchasing.ts
// ==========================================
// Suppliers, purchase orders and transfers (server §12).
// ==========================================
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-native-toast-message";
import {
  purchasingApi,
  type BackendPurchaseOrder,
  type BackendSupplier,
  type BackendTransfer,
  type PurchaseOrderStatus,
  type TransferStatus,
} from "../config/purchasingApi";
import type { Pagination } from "../config/orderApi";
import { inventoryKeys } from "./useInventory";

export const purchasingKeys = {
  all: ["purchasing"] as const,
  suppliers: (params?: unknown) =>
    [...purchasingKeys.all, "suppliers", params ?? {}] as const,
  purchaseOrders: (params?: unknown) =>
    [...purchasingKeys.all, "purchase-orders", params ?? {}] as const,
  purchaseOrder: (id: string) =>
    [...purchasingKeys.all, "purchase-order", id] as const,
  transfers: (params?: unknown) =>
    [...purchasingKeys.all, "transfers", params ?? {}] as const,
  transfer: (id: string) => [...purchasingKeys.all, "transfer", id] as const,
};

/** The message the server sent, or a sensible fallback. */
const messageFrom = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message ?? fallback;
};

// ---------------- Suppliers ----------------

export function useSuppliersQuery(params?: {
  active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ rows: BackendSupplier[]; pagination: Pagination }, Error>({
    queryKey: purchasingKeys.suppliers(params),
    queryFn: async () => {
      const token = await getToken();
      return purchasingApi.listSuppliers(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 5,
  });

  return { ...query, suppliers: query.data?.rows ?? [] };
}

export function useCreateSupplier() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      contact?: string;
      email?: string;
      phone?: string;
    }) => {
      const token = await getToken();
      return purchasingApi.createSupplier(input, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.suppliers() });
      toast.show({ type: "successToast", text2: res.message ?? "Supplier created", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not create supplier"), topOffset: 100 });
    },
  });
}
// ---------------- Purchase orders ----------------

export function usePurchaseOrdersQuery(params?: {
  supplier?: string;
  status?: PurchaseOrderStatus;
  page?: number;
  limit?: number;
}) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ rows: BackendPurchaseOrder[]; pagination: Pagination }, Error>({
    queryKey: purchasingKeys.purchaseOrders(params),
    queryFn: async () => {
      const token = await getToken();
      return purchasingApi.listPurchaseOrders(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 30,
    keepPreviousData: true,
  });

  return { ...query, orders: query.data?.rows ?? [] };
}

export function usePurchaseOrderQuery(id?: string) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendPurchaseOrder | undefined, Error>({
    queryKey: purchasingKeys.purchaseOrder(id ?? ""),
    queryFn: async () => {
      const token = await getToken();
      return purchasingApi.getPurchaseOrder(id!, token);
    },
    enabled: Boolean(isSignedIn && id),
    staleTime: 1000 * 15,
  });

  return { ...query, order: query.data };
}

export function useCreatePurchaseOrder() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof purchasingApi.createPurchaseOrder>[0]) => {
      const token = await getToken();
      return purchasingApi.createPurchaseOrder(input, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.purchaseOrders() });
      toast.show({ type: "successToast", text2: res.message ?? "Purchase order created", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not create purchase order"), topOffset: 100 });
    },
  });
}

/**
 * Books goods in. This is the call that makes stock exist.
 *
 * Both the purchase order and the inventory levels are invalidated, because a
 * receipt changes what was ordered *and* what is on the shelf.
 */
export function useReceivePurchaseOrder(id: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      warehouseId: string;
      items: { productId: string; sku?: string; quantity: number }[];
    }) => {
      const token = await getToken();
      return purchasingApi.receive(id, input, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.show({ type: "successToast", text2: res.message ?? "Stock received", topOffset: 100 });
    },
    onError: (error) => {
      // 409 means the receipt exceeded what was ordered — a data problem for
      // the user to fix, not something to retry.
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not receive stock"), topOffset: 100 });
    },
  });
}

/**
 * Cancels an order. The server 409s once any line has stock received against it,
 * because cancelling then would orphan goods that are physically on a shelf.
 *
 * Wraps an API method that existed with no hook over it — the endpoint was
 * reachable only by hand until a screen needed it.
 */
export function useCancelPurchaseOrder() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return purchasingApi.cancelPurchaseOrder(id, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.purchaseOrders() });
      toast.show({ type: "successToast", text2: res.message ?? "Order cancelled", topOffset: 100 });
    },
    onError: (error) => {
      // 409: something was already received. Cancelling now would lose stock.
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not cancel this order"), topOffset: 100 });
    },
  });
}

// ---------------- Transfers ----------------

export function useTransfersQuery(params?: {
  status?: TransferStatus;
  warehouse?: string;
  page?: number;
  limit?: number;
}) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<{ rows: BackendTransfer[]; pagination: Pagination }, Error>({
    queryKey: purchasingKeys.transfers(params),
    queryFn: async () => {
      const token = await getToken();
      return purchasingApi.listTransfers(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 15,
    keepPreviousData: true,
  });

  return { ...query, transfers: query.data?.rows ?? [] };
}

export function useCreateTransfer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Parameters<typeof purchasingApi.createTransfer>[0]) => {
      const token = await getToken();
      return purchasingApi.createTransfer(input, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.transfers() });
      toast.show({ type: "successToast", text2: res.message ?? "Transfer created", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not create transfer"), topOffset: 100 });
    },
  });
}

/**
 * Advances a transfer. Only `completed` moves stock.
 *
 * The server guards on the current status, so a 409 means somebody completed it
 * first — refreshing is the right response, not a retry.
 */
export function useSetTransferStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; status: TransferStatus }) => {
      const token = await getToken();
      return purchasingApi.setTransferStatus(input.id, input.status, token);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: purchasingKeys.transfers() });
      queryClient.invalidateQueries({
        queryKey: purchasingKeys.transfer(variables.id),
      });
      // Completing a transfer moves stock between warehouses.
      if (variables.status === "completed") {
        queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      }
      toast.show({ type: "successToast", text2: res.message ?? "Transfer updated", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not update transfer"), topOffset: 100 });
    },
  });
}

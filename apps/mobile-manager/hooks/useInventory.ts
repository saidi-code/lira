// hooks/useInventory.ts
// ==========================================
// Stock levels, warehouses and the movement ledger.
//
// Every hook here is inert unless the caller is signed in, so a screen can mount
// before Clerk has resolved without firing a request that will 401.
// ==========================================
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-native-toast-message";
import {
  inventoryApi,
  type BackendInventoryRow,
  type BackendStockMovement,
  type BackendWarehouse,
  type MovementQueryParams,
} from "../config/inventoryApi";
import type { Pagination } from "../config/orderApi";

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (params?: { warehouse?: string; page?: number; limit?: number }) =>
    [...inventoryKeys.all, "list", params ?? {}] as const,
  lowStock: (warehouse?: string) =>
    [...inventoryKeys.all, "low-stock", warehouse ?? "all"] as const,
  movements: (params?: MovementQueryParams) =>
    [...inventoryKeys.all, "movements", params ?? {}] as const,
  warehouses: () => [...inventoryKeys.all, "warehouses"] as const,
};

/** The message the server sent, or a sensible fallback. */
const messageFrom = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message ?? fallback;
};

/** Shown before the first response, and if one is empty. */
const EMPTY: Pagination = { total: 0, page: 1, pages: 1 };

export function useInventoryQuery(params?: {
  warehouse?: string;
  page?: number;
  limit?: number;
}) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<
    { rows: BackendInventoryRow[]; pagination: Pagination },
    Error
  >({
    queryKey: inventoryKeys.list(params),
    queryFn: async () => {
      const token = await getToken();
      return inventoryApi.list(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 30,
    keepPreviousData: true,
  });

  return {
    ...query,
    rows: query.data?.rows ?? [],
    pagination: query.data?.pagination ?? EMPTY,
  };
}

export function useLowStockQuery(warehouse?: string) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendInventoryRow[], Error>({
    queryKey: inventoryKeys.lowStock(warehouse),
    queryFn: async () => {
      const token = await getToken();
      return inventoryApi.lowStock({ warehouse }, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 30,
  });

  return { ...query, rows: query.data ?? [] };
}

export function useMovementsQuery(params?: MovementQueryParams) {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<
    { rows: BackendStockMovement[]; pagination: Pagination },
    Error
  >({
    queryKey: inventoryKeys.movements(params),
    queryFn: async () => {
      const token = await getToken();
      return inventoryApi.movements(params, token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 15,
    keepPreviousData: true,
  });

  return {
    ...query,
    movements: query.data?.rows ?? [],
    pagination: query.data?.pagination ?? EMPTY,
  };
}

export function useWarehousesQuery() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendWarehouse[], Error>({
    queryKey: inventoryKeys.warehouses(),
    queryFn: async () => {
      const token = await getToken();
      return inventoryApi.warehouses(token);
    },
    enabled: Boolean(isSignedIn),
    // Warehouses change rarely; a stale list is cheaper than a request per screen.
    staleTime: 1000 * 60 * 10,
  });

  return { ...query, warehouses: query.data ?? [] };
}

/**
 * Marks a warehouse as the default. The server demotes the incumbent in the
 * same pass, so there is never a moment with two defaults.
 *
 * Wraps an API method that existed with no hook over it — the endpoint was
 * reachable only by hand until a screen needed it.
 */
export function useSetDefaultWarehouse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return inventoryApi.setDefaultWarehouse(id, token);
    },
    onSuccess: () => {
      // Every warehouse row changed, not just the one promoted.
      queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses() });
      toast.show({ type: "successToast", text2: "Default warehouse updated", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not set the default warehouse"), topOffset: 100 });
    },
  });
}

/**
 * Manual correction. Admin/manager only; the server 409s if it would go negative.
 *
 * Invalidates both the levels and the movements, because a correction is
 * exactly the event that makes the ledger worth re-reading.
 */
export function useAdjustStock() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      productId: string;
      sku?: string;
      warehouseId: string;
      quantity: number;
      reason: string;
    }) => {
      const token = await getToken();
      return inventoryApi.adjust(input, token);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      toast.show({ type: "successToast", text2: res.message ?? "Stock adjusted", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({
        type: "errorToast",
        text2: messageFrom(error, "Could not adjust stock"),
        topOffset: 100,
      });
    },
  });
}

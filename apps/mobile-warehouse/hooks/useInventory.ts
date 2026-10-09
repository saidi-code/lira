// hooks/useInventory.ts
// ==========================================
// Stock levels, warehouses and the movement ledger.
//
// Every hook here is inert unless the caller is signed in, so a screen can mount
// before Clerk has resolved without firing a request that will 401.
// ==========================================
import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "@tanstack/react-query";
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

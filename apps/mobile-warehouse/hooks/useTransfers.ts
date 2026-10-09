import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-native-toast-message";
import { inventoryKeys } from "./useInventory";
import {
  transfersApi,
  type BackendTransfer,
  type TransferStatus,
} from "../config/transfersApi";
import type { Pagination } from "../config/orderApi";

const transferKeys = {
  all: ["transfers"] as const,
  list: (params?: object) => [...transferKeys.all, "list", params ?? {}] as const,
};

const messageFrom = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

export function useTransfersQuery(params?: {
  status?: TransferStatus;
  warehouse?: string;
  page?: number;
  limit?: number;
}) {
  const { getToken, isSignedIn } = useAuth();
  const query = useQuery<{ rows: BackendTransfer[]; pagination: Pagination }, Error>({
    queryKey: transferKeys.list(params),
    queryFn: async () => transfersApi.list(params, await getToken()),
    enabled: Boolean(isSignedIn),
    staleTime: 15_000,
    keepPreviousData: true,
  });
  return { ...query, transfers: query.data?.rows ?? [] };
}

export function useCreateTransfer() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: Parameters<typeof transfersApi.create>[0]) =>
      transfersApi.create(input, await getToken()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all });
      toast.show({ type: "successToast", text2: res.message ?? "Transfer created", topOffset: 100 });
    },
    onError: (error) => {
      toast.show({ type: "errorToast", text2: messageFrom(error, "Could not create transfer"), topOffset: 100 });
    },
  });
}

export function useSetTransferStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: TransferStatus }) =>
      transfersApi.setStatus(input.id, input.status, await getToken()),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all });
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

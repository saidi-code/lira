// hooks/useAddress.ts
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import toast from "react-native-toast-message";
import type { AxiosError } from "axios";
import {
  addressApi,
  AddAddressInput,
  BackendAddress,
  UpdateAddressInput,
} from "../config/addressApi";   // ← fix path if it lives in services/

import { openAuthModal } from "./useCart";

// ==========================================
// 1. Query Keys
// ==========================================
export const addressKeys = {
  all: ["addresses"] as const,
  userAddresses: () => [...addressKeys.all, "user"] as const,
  detail: (id: string) => [...addressKeys.all, "detail", id] as const,
};

export const MAX_ADDRESSES = 3;

// Shape of backend error body
interface ApiErrorBody {
  success?: boolean;
  message?: string;
}
type ApiError = AxiosError<ApiErrorBody>;

// ==========================================
// 2. Query: useAddressesQuery
// ==========================================
export function useAddressesQuery() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendAddress[], Error>({
    queryKey: addressKeys.userAddresses(),
    queryFn: async () => {
      if (!isSignedIn) return [];
      const token = await getToken();
      return addressApi.getMyaddresses(token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 2,
  });

  const addresses = query.data ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? null;
  const addressCount = addresses.length;
  const canAddMore = addressCount < MAX_ADDRESSES;

  return {
    ...query,
    addresses,
    defaultAddress,
    addressCount,
    canAddMore,
    maxAddresses: MAX_ADDRESSES,
  };
}

// ==========================================
// 3. useAddAddress
// ==========================================
export function useAddAddress() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (payload: AddAddressInput) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return addressApi.addAddress(payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.userAddresses() });
      toast.show({
        type: "successToast",
        text2: "تمت إضافة العنوان بنجاح",
        topOffset: 100,
      });
    },
    onError: (error: ApiError) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء إضافة العنوان";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useAddAddress error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 4. useUpdateAddress
// ==========================================
export function useUpdateAddress() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async ({
      addressId,
      payload,
    }: {
      addressId: string;
      payload: UpdateAddressInput;
    }) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return addressApi.updateAddress(addressId, payload, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.userAddresses() });
      toast.show({
        type: "successToast",
        text2: "تم تحديث العنوان بنجاح",
        topOffset: 100,
      });
    },
    onError: (error: ApiError) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء تحديث العنوان";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useUpdateAddress error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 5. useDeleteAddress
// ==========================================
export function useDeleteAddress() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return addressApi.deleteAddress(addressId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.userAddresses() });
      toast.show({
        type: "successToast",
        text2: "تم حذف العنوان بنجاح",
        topOffset: 100,
      });
    },
    onError: (error: ApiError) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء حذف العنوان";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useDeleteAddress error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 6. useSetDefaultAddress
// ==========================================
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return addressApi.setDefaultAddress(addressId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.userAddresses() });
      toast.show({
        type: "successToast",
        text2: "تم تعيين العنوان كافتراضي",
        topOffset: 100,
      });
    },
    onError: (error: ApiError) => {
      if (error?.message === "Authentication required") return;
      const message =
        error?.response?.data?.message ?? "حدث خطأ أثناء تعيين العنوان الافتراضي";
      toast.show({ type: "errorToast", text2: message, topOffset: 100 });
      console.error("useSetDefaultAddress error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 7. Unified useAddress
// ==========================================
export function useAddress() {
  const { isSignedIn } = useAuth();
  const addressesQuery = useAddressesQuery();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  // v5: use isPending on mutations
  const loading =
    addressesQuery.isLoading ||
    addAddressMutation.isPending ||
    updateAddressMutation.isPending ||
    deleteAddressMutation.isPending ||
    setDefaultAddressMutation.isPending;

  const addAddress = useCallback(
    async (payload: AddAddressInput) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      if (addressesQuery.addressCount >= MAX_ADDRESSES) {
        toast.show({
          type: "errorToast",
          text2: `يمكنك إضافة ${MAX_ADDRESSES} عناوين كحد أقصى`,
          topOffset: 100,
        });
        return;
      }
      return addAddressMutation.mutateAsync(payload);
    },
    [isSignedIn, addressesQuery.addressCount, addAddressMutation]
  );

  const updateAddress = useCallback(
    async (addressId: string, payload: UpdateAddressInput) => {
      if (!isSignedIn || !addressId) return;
      return updateAddressMutation.mutateAsync({ addressId, payload });
    },
    [isSignedIn, updateAddressMutation]
  );

  const deleteAddress = useCallback(
    async (addressId: string) => {
      if (!isSignedIn || !addressId) return;
      return deleteAddressMutation.mutateAsync(addressId);
    },
    [isSignedIn, deleteAddressMutation]
  );

  const setDefaultAddress = useCallback(
    async (addressId: string) => {
      if (!isSignedIn || !addressId) return;
      return setDefaultAddressMutation.mutateAsync(addressId);
    },
    [isSignedIn, setDefaultAddressMutation]
  );

  return {
    // Data
    addresses: addressesQuery.addresses,
    defaultAddress: addressesQuery.defaultAddress,
    addressCount: addressesQuery.addressCount,
    canAddMore: addressesQuery.canAddMore,
    maxAddresses: MAX_ADDRESSES,
    loading,
    isLoading: loading,

    // Actions
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refetch: addressesQuery.refetch,

    // Raw mutations
    addAddressMutation,
    updateAddressMutation,
    deleteAddressMutation,
    setDefaultAddressMutation,

    openAuthModal,
  };
}

export default useAddress;
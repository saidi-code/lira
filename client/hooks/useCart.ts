import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-native-toast-message";
import {
  cartApi,
  AddToCartInput,
  BackendCart,
  DeleteCartItemInput,
  UpdateCartItemInput,
} from "../config/cartApi";
import { ICartItem, IProduct } from "../constants/types";

// ==========================================
// 1. TanStack Query Keys
// ==========================================
export const cartKeys = {
  all: ["cart"] as const,
  userCart: () => [...cartKeys.all, "user"] as const,
};

// ==========================================
// 2. Auth Modal Observable (No Context needed)
// ==========================================
let isAuthModalOpen = false;
const authModalListeners = new Set<(isOpen: boolean) => void>();

export const openAuthModal = () => {
  isAuthModalOpen = true;
  authModalListeners.forEach((listener) => listener(true));
};

export const closeAuthModal = () => {
  isAuthModalOpen = false;
  authModalListeners.forEach((listener) => listener(false));
};

export const useAuthModal = () => {
  const [isOpen, setIsOpen] = useState(isAuthModalOpen);

  useEffect(() => {
    authModalListeners.add(setIsOpen);
    return () => {
      authModalListeners.delete(setIsOpen);
    };
  }, []);

  return {
    isOpen,
    open: openAuthModal,
    close: closeAuthModal,
    setIsOpen: (open: boolean) => (open ? openAuthModal() : closeAuthModal()),
  };
};

// ==========================================
// 3. Helper: Map Backend Cart to ICartItem[]
// ==========================================
export function mapBackendCartToItems(cart?: BackendCart | null): ICartItem[] {
  if (!cart || !Array.isArray(cart.items)) return [];
  return cart.items
    .filter((item) => item?.product != null)
    .map((item) => ({
      _id: `${item.product?._id ?? ""}::${item.size ?? ""}::${item.color ?? ""}`,
      product: item.product,
      quantity: item.quantity ?? 0,
      size: item.size ?? null,
      color: item.color ?? null,
      price: item.price ?? item.product?.price ?? 0,
    }));
}

// ==========================================
// 4. Query Hook: useCartQuery
// ==========================================
export function useCartQuery() {
  const { getToken, isSignedIn } = useAuth();

  const query = useQuery<BackendCart, Error>({
    queryKey: cartKeys.userCart(),
    queryFn: async () => {
      if (!isSignedIn) {
        return { _id: "", user: "", items: [], totalAmount: 0 };
      }
      const token = await getToken();
      return cartApi.getCart(token);
    },
    enabled: Boolean(isSignedIn),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const cartItems = useMemo(
    () => (isSignedIn ? mapBackendCartToItems(query.data) : []),
    [isSignedIn, query.data]
  );

  const cartTotal = useMemo(
    () => (isSignedIn ? query.data?.totalAmount ?? 0 : 0),
    [isSignedIn, query.data]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  return {
    ...query,
    cart: query.data,
    cartItems,
    cartTotal,
    itemCount,
  };
}

// ==========================================
// 5. Mutation Hook: useAddToCart
// ==========================================
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (payload: AddToCartInput) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return cartApi.addToCart(payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.userCart(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart() });
      toast.show({
        type: "successToast",
        text2: "تمت إضافة المنتج إلى السلة",
        topOffset: 100,
      });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Erreur lors de l'ajout au panier";
      console.error("useAddToCart error:", error?.response?.data ?? error);
      toast.show({
        type: "errorToast",
        text2: msg,
        topOffset: 100,
      });
    },
  });
}

// ==========================================
// 6. Mutation Hook: useRemoveFromCart
// ==========================================
export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (payload: DeleteCartItemInput) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return cartApi.deleteCartItem(payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.userCart(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart() });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      console.error("useRemoveFromCart error:", error?.response?.data ?? error);
    },
  });
}

export const useRemoveCartItem = useRemoveFromCart;

// ==========================================
// 7. Mutation Hook: useUpdateCartItem
// ==========================================
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async (payload: UpdateCartItemInput) => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return cartApi.updateCartItem(payload, token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.userCart(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart() });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      const msg =
        error?.response?.data?.message ??
        error?.message ??
        "Erreur lors de la mise à jour du panier";
      console.error("useUpdateCartItem error:", error?.response?.data ?? error);
      toast.show({
        type: "errorToast",
        text2: msg,
        topOffset: 100,
      });
    },
  });
}

export const useUpdateCartQuantity = useUpdateCartItem;

// ==========================================
// 8. Mutation Hook: useClearCart
// ==========================================
export function useClearCart() {
  const queryClient = useQueryClient();
  const { getToken, isSignedIn } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!isSignedIn) {
        openAuthModal();
        throw new Error("Authentication required");
      }
      const token = await getToken();
      return cartApi.clearCart(token);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.userCart(), data);
      queryClient.invalidateQueries({ queryKey: cartKeys.userCart() });
    },
    onError: (error: any) => {
      if (error?.message === "Authentication required") return;
      console.error("useClearCart error:", error?.response?.data ?? error);
    },
  });
}

// ==========================================
// 9. Unified useCart Hook
// ==========================================
export function useCart() {
  const { isSignedIn } = useAuth();
  const cartQuery = useCartQuery();
  const addToCartMutation = useAddToCart();
  const removeFromCartMutation = useRemoveFromCart();
  const updateCartItemMutation = useUpdateCartItem();
  const clearCartMutation = useClearCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const loading =
    cartQuery.isLoading ||
    addToCartMutation.isLoading ||
    removeFromCartMutation.isLoading ||
    updateCartItemMutation.isLoading ||
    clearCartMutation.isLoading;

  const addToCart = useCallback(
    async (
      product: IProduct | null,
      size: string | null = null,
      color: string | null = null,
      quantity: number = 1
    ) => {
      if (!isSignedIn) {
        openAuthModal();
        return;
      }
      if (!product?._id) {
        console.error("addToCart: missing product id");
        return;
      }
      return addToCartMutation.mutateAsync({
        productId: product._id,
        size: size ?? null,
        color: color ?? null,
        quantity,
      });
    },
    [isSignedIn, addToCartMutation]
  );

  const removeFromCart = useCallback(
    async (
      itemId: string,
      size: string | null = null,
      color: string | null = null
    ) => {
      if (!isSignedIn || !itemId) return;
      return removeFromCartMutation.mutateAsync({
        productId: itemId,
        size: size ?? null,
        color: color ?? null,
      });
    },
    [isSignedIn, removeFromCartMutation]
  );

  const updateCartItemQuantity = useCallback(
    async (
      itemId: string,
      arg2: number | string | null,
      arg3?: any,
      arg4?: string | null
    ) => {
      if (!isSignedIn || !itemId) return;

      // Handle both signatures: (id, quantity, size, color) and (id, size, quantity, color)
      let quantity: number;
      let size: string | null = null;
      let color: string | null = null;

      if (typeof arg2 === "number") {
        quantity = arg2;
        size = (arg3 as string) ?? null;
        color = arg4 ?? null;
      } else {
        size = arg2 ?? null;
        quantity = typeof arg3 === "number" ? arg3 : 1;
        color = arg4 ?? null;
      }

      if (quantity < 1) {
        return removeFromCartMutation.mutateAsync({
          productId: itemId,
          size,
          color,
        });
      }

      return updateCartItemMutation.mutateAsync({
        productId: itemId,
        quantity,
        size,
        color,
      });
    },
    [isSignedIn, updateCartItemMutation, removeFromCartMutation]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) return;
    return clearCartMutation.mutateAsync();
  }, [isSignedIn, clearCartMutation]);

  return {
    // Data
    cart: cartQuery.cart,
    cartItems: cartQuery.cartItems,
    cartTotal: cartQuery.cartTotal,
    itemCount: cartQuery.itemCount,
    loading,
    isLoading: loading,

    // Actions
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    refetch: cartQuery.refetch,

    // Selection helpers
    pSize: selectedSize,
    setPSize: setSelectedSize,
    pColor: selectedColor,
    setPColor: setSelectedColor,

    // Raw mutations for fine-grained control
    addToCartMutation,
    removeFromCartMutation,
    updateCartItemMutation,
    clearCartMutation,

    // Auth modal trigger
    openAuthModal,
  };
}

export default useCart;

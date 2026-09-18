import { useAuth } from "@clerk/clerk-expo";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiClient } from "../config/api";
import { ICartContext, ICartItem, IProduct } from "../constants/types";
import toast from "react-native-toast-message";
import LoginOrRegisterModal from "../components/LoginOrRegisterModal";

const CartContext = createContext<ICartContext | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  // Clerk's getToken changes identity every render — pin it with a ref
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const fetchCartItems = useCallback(async () => {
    if (!isSignedIn) {
      setCartItems([]);
      setCartTotal(0);
      return;
    }
    try {
      setLoading(true);
      const token = await getTokenRef.current();
      const { data } = await apiClient.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data?.success) {
        const cart = data.data;
        const itemsArray = Array.isArray(cart?.items) ? cart.items : [];

        const mappedCartItems: ICartItem[] = itemsArray.map((item: any) => ({
          _id: `${item?.product?._id ?? ""}::${item?.size ?? ""}::${item?.color ?? ""}`,
          product: item?.product ?? null,
          quantity: item?.quantity ?? 0,
          size: item?.size ?? null,
          color: item?.color ?? null,
          price: item?.price ?? 0,
        }));

        setCartItems(mappedCartItems);
        setCartTotal(cart?.totalAmount ?? 0);
      }
    } catch (error: any) {
      console.error("Error Fetch Cart Items", error);
    } finally {
      setLoading(false);
    }
    // isSignedIn is the only real dep; getTokenRef is stable
  }, [isSignedIn]);

  // Keep fetchCartItems ref for use in callbacks below
  const fetchCartItemsRef = useRef(fetchCartItems);
  fetchCartItemsRef.current = fetchCartItems;

  const addToCart = useCallback(
    async (
      product: IProduct | null,
      size: string | null = null,
      color: string | null = null
    ) => {
      if (!isSignedIn) {
        setAuthModalVisible(true);
        return;
      }
      if (!product?._id) {
        console.error("addToCart: missing product id");
        return;
      }
      try {
        setLoading(true);
        const token = await getTokenRef.current();
        const { data } = await apiClient.post(
          "/cart/add",
          {
            productId: product._id,
            quantity: 1,
            size: size ?? null,
            color: color ?? null,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data?.success) {
          await fetchCartItemsRef.current();
          toast.show({
            type: "successToast",
            text2: "تمت إضافة المنتج إلى السلة",
            topOffset: 100,
          });
        } else {
          console.error("Add to cart failed:", data);
        }
      } catch (error: any) {
        console.error("Error adding to cart:", error?.response?.data ?? error);
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn]
  );

  const removeFromCart = useCallback(
    async (
      itemId: string,
      size: string | null = null,
      color: string | null = null
    ) => {
      if (!isSignedIn || !itemId) return;

      try {
        setLoading(true);
        const token = await getTokenRef.current();

        const { data } = await apiClient.delete(`/cart/item/${itemId}`, {
          params: {
            size: size ?? undefined,
            color: color ?? undefined,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (data?.success) {
          await fetchCartItemsRef.current();
        } else {
          console.error("Remove from cart failed:", data);
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn]
  );

  const updateCartItemQuantity = useCallback(
    async (
      itemId: string,
      newQty: number,
      size: string | null = null,
      color: string | null = null
    ) => {
      if (!isSignedIn || newQty < 1) return;

      try {
        setLoading(true);
        const token = await getTokenRef.current();
        const rawId = itemId.includes("::") ? itemId.split("::")[0] : itemId;
        const { data } = await apiClient.put(
          `/cart/item/${rawId}`,
          {
            quantity: newQty,
            size,
            color,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (data?.success) {
          await fetchCartItemsRef.current();
        } else {
          console.error("Update cart item failed:", data?.message);
        }
      } catch (error) {
        console.error("Error updating cart item:", error);
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getTokenRef.current();
      const { data } = await apiClient.delete(`/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data?.success) {
        setCartItems([]);
        setCartTotal(0);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  const itemCount = useMemo(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems]
  );

  // Use ref so the effect only re-runs on auth state change
  const fetchCartItemsEffectRef = useRef(fetchCartItems);
  fetchCartItemsEffectRef.current = fetchCartItems;

  useEffect(() => {
    if (isSignedIn) {
      fetchCartItemsEffectRef.current();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const contextValue = useMemo<ICartContext>(
    () => ({
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      cartTotal,
      itemCount,
      loading,
      cartItems,
      pSize: selectedSize,
      setPSize: setSelectedSize,
      pColor: selectedColor,
      setPColor: setSelectedColor,
    }),
    [
      addToCart,
      removeFromCart,
      updateCartItemQuantity,
      clearCart,
      cartTotal,
      itemCount,
      loading,
      cartItems,
      selectedSize,
      selectedColor,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      <LoginOrRegisterModal show={authModalVisible} setShow={setAuthModalVisible} />
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

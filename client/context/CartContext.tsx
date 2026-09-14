import { useAuth } from "@clerk/clerk-expo";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const fetchCartItems = useCallback(async () => {
    if (!isSignedIn) {
      setCartItems([]);
      setCartTotal(0);
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
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
  }, [getToken, isSignedIn]);

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
        const token = await getToken();
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
          await fetchCartItems();
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
    [getToken, isSignedIn, fetchCartItems]
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
        const token = await getToken();

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
          await fetchCartItems();
        } else {
          console.error("Remove from cart failed:", data);
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
      } finally {
        setLoading(false);
      }
    },
    [getToken, isSignedIn, fetchCartItems]
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
        const token = await getToken();
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
          await fetchCartItems();
        } else {
          console.error("Update cart item failed:", data?.message);
        }
      } catch (error) {
        console.error("Error updating cart item:", error);
      } finally {
        setLoading(false);
      }
    },
    [getToken, isSignedIn, fetchCartItems]
  );

  const clearCart = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
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
  }, [getToken, isSignedIn]);

  const itemCount = useMemo(
    () => cartItems.reduce((count, item) => count + item.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    if (isSignedIn) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
  }, [isSignedIn, fetchCartItems]);

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

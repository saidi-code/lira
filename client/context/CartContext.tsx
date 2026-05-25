import { useAuth } from "@clerk/clerk-expo";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "../config/api";
import { ICartContext, ICartItem, IProduct } from "../constants/types";

import {useRouter} from "expo-router";
import LoginOrRegisterModal from "../components/LoginOrRegisterModal";
const CartContext = createContext<ICartContext | undefined>(undefined);
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const { getToken, isSignedIn } = useAuth();
  const fetchCartItems = async () => {
    if (!isSignedIn) {
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (data.success) {
        const serverCart = data.data;
        const mappedCartItems: ICartItem[] = serverCart.map((item: any) => ({
          _id: item.product?._id,
          product: item?.product,
          quantity: item?.quantity,
          size: item?.size,
          price: item?.price,
        }));
        setCartItems(mappedCartItems);
        setCartTotal(serverCart.totalAmount);
      }
    } catch (error: any) {
      console.error("Error Fetch Cart Items", error);
    } finally {
      setLoading(false);
    }
  };

  const [authModalVisible, setAuthModalVisible] = useState(false);

  const addToCart = async (
    product: IProduct,
    size: string | null = null,
    color: string | null = null,
  ) => {
    if (!isSignedIn) {
      setAuthModalVisible(true);
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.post(
        "/cart/add",
        {
          productId: product._id,
          quantity: 1,
          size,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
        await fetchCartItems();
      }
      setLoading(false);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (
    itemId: string,
    size: string | null = null,
    color: string | null = null,
  ) => {
    if (!isSignedIn) {
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.delete(
        `/cart/item/${itemId}?size=${size}&color=${color}`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        await fetchCartItems();
      }

      setLoading(false);
    } catch (error) {
      console.error("Error removing from cart:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const updateCartItemQuantity = async (
    itemId: string,
    size: string | null = null,
    quantity: number,
    color: string | null = null,
  ) => {
    if (!isSignedIn) {
      return;
    }
    if (quantity < 1) {
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.put(
        `/cart/item/${itemId}`,
        {
          quantity,
          size,
          color,
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        await fetchCartItems();
      }

      setLoading(false);
    } catch (error) {
      console.error("Error updating cart item:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!isSignedIn) {
      return;
    }
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.delete(
        `/cart`,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (data.success) {
        setCartItems([]);
        setCartTotal(0);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  useEffect(() => {
    if (isSignedIn) {
      fetchCartItems();
    } else {
      setCartItems([]);
      setCartTotal(0);
    }
  }, [isSignedIn]);

  return (
    <CartContext.Provider
      value={{
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartTotal,
        itemCount,
        loading,
        cartItems,
      }}
    >
      <LoginOrRegisterModal show={authModalVisible} setShow = {setAuthModalVisible} />
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

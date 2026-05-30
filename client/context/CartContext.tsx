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
import  toast  from "react-native-toast-message";
import {useRouter} from "expo-router";
import LoginOrRegisterModal from "../components/LoginOrRegisterModal";
const CartContext = createContext<ICartContext | undefined>(undefined);
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<ICartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
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
        const cart = data.data;
        const itemsArray = Array.isArray(cart?.items) ? cart.items : [];

        const mappedCartItems: ICartItem[] = itemsArray.map((item: any) => ({
          _id: item?.product?._id ?? "",
          product: item?.product ?? null,
          quantity: item?.quantity ?? 0,
          size: item?.size ?? null,
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
  };

  const [authModalVisible, setAuthModalVisible] = useState(false);

  const addToCart = async (
    product: IProduct | null,
    size: string | null = null,
    color: string | null = null,
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
      const { data } = await axios.post(
        "/cart/add",
        {
          productId: product?._id,
          quantity: 1,
          size: size ?? null,
          // backend currently ignores color, but we keep sending it for consistency
          color: color ?? null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (data.success) {
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
      console.error(
        "Error adding to cart:",
        error?.response?.data ?? error,
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (
    itemId: string,
    size: string | null = null,
    color: string | null = null,
  ) => {
    if (!isSignedIn || !itemId) return;

    try {
      setLoading(true);
      const token = await getToken();

      const { data } = await axios.delete(`/cart/item/${itemId}`, {
        params: {
          // backend uses: req.query.size and req.query.color
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
        pSize: selectedSize,
        setPSize: setSelectedSize,
        pColor: selectedColor,
        setPColor: setSelectedColor,  
      }}
    >
      <LoginOrRegisterModal show={authModalVisible} 
      setShow = {setAuthModalVisible} />
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

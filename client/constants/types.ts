export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface IProduct {
  _id: string;
  name: string;
  subtitle: string;
  type: "simple" | "variable";
  price: number;
  images?: string[];
  description: string;
  sizes?: string[] | null;
  category: string;
  stock?: number;
  colors?: [
    {
      name: string;
      hex: string;
      images: string[];
      variants: [
        {
          size: string;
          sku: string;
          stock: number;
        },
      ];
    },
  ];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ProductCardProps {
  product: IProduct;
}
export interface HeaderProps {
  showSearch?: boolean;
  showBack?: boolean;
}
export interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
 
}

export interface FavorisItemsProps {
  product: IProduct;
}
export interface CartItemProps {
  loading:boolean;
  item: ICartItem;
  removeItem: (
    itemId: string,
    size?: string | null,
    color?: string | null,
  ) => void;
  updateItemQuantity: (
    itemId: string,
    newQty: number,
    size: string | null,
    color: string | null,
  ) => void;
}
export interface ICollection {
  _id: string;
  banner: string;
  title: string;
  subtitle: string;
  cta: string;
  isFeatured: boolean;
  isActive: boolean;
  products: IProduct[];
}

export interface ICartItem {
  _id: string;
  product: IProduct;
  quantity: number;
  size?: string | null;
  color?: string | null;
  price: number;
}

export interface ICartContext {
  addToCart: (product: IProduct, size?: string | null, color?: string | null) => Promise<void>;
  removeFromCart: (
    itemId: string,
    size?: string | null,
    color?: string | null,
  ) => Promise<void>;
  updateCartItemQuantity: (
    itemId: string,
    size: string | null,
    quantity: number,
    color: string | null,
    pSize?: string | null,
    pColor?: string | null,
    setColor?: (color: string | null) => void,
    setSize?: (size: string | null) => void,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  itemCount: number;
  loading: boolean;
  cartItems: ICartItem[];
}
export interface IFavorisItem {
  productId: string;
}
export interface IFavorisContextValue {
  favorisItem: IFavorisItem[];
  isLiked: (productId: string) => boolean;
  addToFavoris: (product: IProduct) => void;
  removeFromFavoris: (productId: string) => void;
  toggleLike: (product: IProduct) => void;
  itemsCount: number;
}

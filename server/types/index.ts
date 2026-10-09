import { Document, Types } from "mongoose";
export interface IUser {
  clerkId?: string;
  /**
   * An `ObjectId`, not a `string`.
   *
   * This was declared `string`, which is only ever accidentally correct: `.id`
   * gives a string, `_id` does not. Code that read `_id` as a string got away
   * with it until it was passed into a Mongoose filter, where the mismatch
   * surfaces as an overload error rather than a wrong query.
   */
  _id: Types.ObjectId;
  name: string;
  /** Optional: Clerk permits phone-only accounts, so this may be absent. */
  email?: string;
  role: "user" | "admin" | "manager" | "cashier" | "warehouse_staff";
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  image?: string;
  createdAt: string;
}

export interface IProduct {
  name: string;
  description: string;
  subtitle: string;
  brand:string,
  type: "simple" | "variable";
  price: number;
  images?: string[];
  sizes?: string[] | null;
  category: string;
  subCategory:"man"|"woman"|"kids"

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
export interface ICart extends Document {
    user: Types.ObjectId;
    items: ICartItem[];
    totalAmount: number;
    calculateTotal(): number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICartItem {
  _id: string;
  product: IProduct;
  sku?: string | null;
  quantity: number;
  size?: string | null;
  color?: string | null;
  price: number;
}

export interface ICartContext {
  addToCart: (product: IProduct, size?: string | null) => Promise<void>;
  removeFromCart: (itemId: string, size: string | null) => Promise<void>;
  updateCartItemQuantity: (
    itemId: string,
    size: string | null,
    quantity: number,
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
  itemsCount: number;
}

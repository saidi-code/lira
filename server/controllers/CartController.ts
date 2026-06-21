import { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
// Get User Cart
// Get /api/v1/cart
export const getCart = async (req: Request, res: Response) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product", "name images subtitle price stock colors type");
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json({ success: true, data: cart });
  } catch (error: any) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Add To Cart
// POST /api/v1/cart/add
export const addToCart = async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1, size, color } = req.body;
    console.log("addToCart request body:", req.body);

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required" });
    }

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "quantity must be greater than 0" });
    }

    if ((productId as string).length < 12) {
      // prevents obvious invalid ObjectId values
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }
    console.log("addToCart called with:", { productId, quantity, size, color });
    const product  = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
if(product.type==="simple"){
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficent stock" });
    }
}
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    if (product.type === "variable") {
      if (!color || !size) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Size and color must be selected for variable products",
          });
      }

      const variant = product.colors?.find((c) => c.hex === color)?.variants?.find((v) => {
        const variantSizes = (v as any)?.size;
        return Array.isArray(variantSizes) ? variantSizes.includes(size) : String(variantSizes) === String(size);
      });



      if (!variant || !variant.isActive) {
        return res
          .status(400)
          .json({ success: false, message: "Selected variant is not available" });
      }
      if ((variant as any).stock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficent stock for selected variant" });
      }
    }

    // identity for a cart item is: (productId + size + color)
    // For simple products we normalize size/color to null so duplicates are merged correctly.
    // For variable products we MUST persist the chosen color name and size.
    const normalizedSize = product.type === "simple" ? null : (size ?? null);
    const normalizedColor = product.type === "simple" ? null : (color ?? null);

    console.log("addToCart normalized:", {
      productId,
      productType: product.type,
      size,
      color,
      normalizedSize,
      normalizedColor,
    });



    const existingItem: any = cart.items.find(
      (item: any) =>
        item.product?.toString?.() === productId &&
        (item.size ?? null) === normalizedSize &&
        (item.color ?? null) === normalizedColor,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      (cart.items as any).push({
        product: product._id,
        quantity,
        price: product.price,
        size: normalizedSize,
        color: normalizedColor,
      });
    }


    // Remove duplicate lines for safety (in case cart already contains duplicates)
    // Keep only the first occurrence per (product + size + color)
    const seen = new Set<string>();
    cart.items = (cart.items as any).filter((it: any) => {
      const key = `${it.product?.toString?.() ?? ""}::${it.size ?? ""}::${it.color ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    cart.calculateTotal();

    await cart.save();

    // remove corrupted cart items (where product reference is null/undefined)
    // to avoid populate() / client crashes
    cart.items = cart.items.filter(
      (i: any) => i?.product !== null && i?.product !== undefined,
    );

    await cart.populate("items.product", "name images price stock sizes colors type");
    res.json({ success: true, data: cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update Item Quantity
// PUT /api/v1/cart/item/:productId
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { quantity, size,color } = req.body;
    const { productId } = req.params;
 
    const cart = await Cart.findOne({ user: req.user._id, });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    //find item in cart

    const item = cart.items.find(
      (item) =>
        item.product._id === productId.toString() &&
        (item.size ?? null) === (size ?? null) &&
        (item.color ?? null) === (color ?? null),
    );

   
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) => {
          const sameProduct = item.product.toString() === productId.toString();
          const sameSize = (item.size ?? null) === (size ?? null);
          const sameColor = (item.color ?? null) === (color ?? null);
          return !(sameProduct && sameSize && sameColor);
        },
      );
    } else {

      const product = await Product.findById(productId);
      if (product!.stock < quantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficent stock" });
      }
      item.quantity = quantity;
    }
    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock colors vcolors");
    res.json({ success: true, data: cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCartItem = async (req: Request, res: Response) => {
  try {
    // const size = req.query.size as string | undefined;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== req.params.productId,
    );
    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock");
    console.log("cart data", cart);
    res.json({ success: true, data: cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Clear Cart
// DELETE api/v1/cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();
    res.json({ success: true, message: "Cart cleared", data: cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

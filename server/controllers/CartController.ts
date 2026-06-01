import { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
// Get User Cart
// Get /api/v1/cart
export const getCart = async (req: Request, res: Response) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    }).populate("items.product", "name images price stock colors vcolors");
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
    // for debugging
   

    const { productId, quantity = 1, size,  color } = req.body;
    console.log("addToCart called with:", { productId, quantity, size, color });
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficent stock" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem: any = cart.items.find(
      (item: any) =>
        item.product?.toString?.() === productId && item.size === size,
    );


    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      // Typescript in this repo expects `ICartItem` shape including `_id`.
      // Mongoose will generate `_id` for embedded subdocuments, so we cast here to unblock build.
      (cart.items as any).push({
        product: product._id,
        quantity,
        price: product.price,
        size,
      });
    }



    cart.calculateTotal();
    await cart.save();

    // remove corrupted cart items (where product reference is null/undefined)
    // to avoid populate() / client crashes
    cart.items = cart.items.filter(
      (i: any) => i?.product !== null && i?.product !== undefined,
    );

    await cart.populate("items.product", "name images price stock");
    res.json({ success: true, data: cart });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Update Item Quantity
// PUT /api/v1/cart/item/:productId
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const { quantity, size } = req.body;
    const { productId } = req.params;
 
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    //find item in cart

    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString() && item.size === size,
    );
   
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }
    
    if (quantity <= 0) {
      cart.items = cart.items.filter(
        (item) =>
          item.product.toString() !== productId.toString() ||
          item.size !== size,
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
// Delete Cart Item
// DELETE api/v1/cart/item/:productId
// export const deleteCartItem = async (req: Request, res: Response) => {
//   try {
//     const size = req.query.size as string | undefined;
//     const color = req.query.color as string | undefined;

//     const cart = await Cart.findOne({ user: req.user._id });
//     if (!cart) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Cart not found" });
//     }

//     // Simple products: identity is (productId + size). Color is ignored.
//     // Variable products: identity is (productId + size + color).
//     cart.items = cart.items.filter((item: any) => {
//       const matchesProduct = item?.product?.toString?.() === req.params.productId;
//       const matchesSize = item?.size === size;
//       const matchesColor = color === undefined ? true : item?.color === color;

//       return !(matchesProduct && matchesSize && matchesColor);
//     });

//     cart.calculateTotal();
//     await cart.save();

//     await cart.populate("items.product", "name images price stock");
//     res.json({ success: true, data: cart });
//   } catch (error: any) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

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

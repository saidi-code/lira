import { NextFunction, Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import { asInteger, asPositiveInteger } from "../utils/validate.js";

/**
 * A sanity ceiling on a single line.
 *
 * Not a stock limit — that is checked against the product — but a bound on what a
 * cart can ask for at all, so a single request cannot create a quantity large
 * enough to be awkward to display or to reason about downstream.
 */
const MAX_CART_QUANTITY = 999;
// Get User Cart
// Get /api/v1/cart
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let cart = await Cart.findOne({
      user: req.user!._id,
    }).populate("items.product", "name images subtitle price stock colors type");
    if (!cart) {
      cart = await Cart.create({ user: req.user!._id, items: [] });
    }
    res.json({ success: true, data: cart });
  } catch (error: any) {
    console.error("Error fetching cart:", error);
    next(error); // status + message decided by the central error handler
  }
};
// Add To Cart
// POST /api/v1/cart/add
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, size, color } = req.body;
    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "productId is required" });
    }

    // Validated rather than compared. `quantity <= 0` and `product.stock <
    // quantity` are both coercing comparisons, so a body of {"quantity": "abc"}
    // makes each of them false: both guards pass, and Mongoose then stores NaN
    // because `NaN < 1` is false as well. See utils/validate.ts.
    const quantity = asPositiveInteger(req.body.quantity ?? 1, "quantity", {
      max: MAX_CART_QUANTITY,
    });

    if (typeof productId !== 'string' || productId.length < 12) {
      // prevents obvious invalid ObjectId values
      return res
        .status(400)
        .json({ success: false, message: "Invalid productId" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
if(product.type==="simple"){
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: `Stock insuffisant : seulement ${product.stock} article(s) disponible(s)` });
    }
}
    let cart = await Cart.findOne({ user: req.user!._id });
    if (!cart) {
      cart = new Cart({ user: req.user!._id, items: [] });
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

      const variant = product.colors?.find((c) => c.hex === color || c.name === color)?.variants?.find((v) => {
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
          .json({ success: false, message: `Stock insuffisant : seulement ${(variant as any).stock} article(s) disponible(s) pour cette variante` });
      }
    }

    // identity for a cart item is: (productId + size + color)
    // For simple products we normalize size/color to null so duplicates are merged correctly.
    // For variable products we MUST persist the chosen color name and size.
    const normalizedSize = product.type === "simple" ? null : (size ?? null);
    const normalizedColor = product.type === "simple" ? null : (color ?? null);



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
    next(error); // status + message decided by the central error handler
  }
};
// Update Item Quantity
// PUT /api/v1/cart/item/:productId
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, size, color } = req.body;
    const { productId } = req.params;


    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ success: false, message: "quantity is required" });
    }

    // Zero and negatives still mean "remove this line" below, so this is
    // asInteger rather than asPositiveInteger — but it is validated, because
    // `quantity <= 0` and `product.stock < quantity` are coercing comparisons and
    // a body of {"quantity": "abc"} passes both of them.
    const wanted = asInteger(quantity, "quantity");

    const cart = await Cart.findOne({ user: req.user!._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // normalize like addToCart (so simple/variable match properly)
    const normalizedSize = product.type === "simple" ? null : (size ?? null);
    const normalizedColor = product.type === "simple" ? null : (color ?? null);

    // Important: req.body.size/color may come as {name} vs {hex} (client passes both from different places)
    // Always try to match the cart item by (productId + size + color) using the normalized values.
    // If not found, fall back to productId-only match (keeps simple products working).
    const item = cart.items.find(
      (it) =>
        it.product.toString() === productId.toString() &&
        (it.size ?? null) === normalizedSize &&
        (it.color ?? null) === normalizedColor,
    )
      ?? cart.items.find((it) => it.product.toString() === productId.toString());


    if (!item) {
      return res.status(404).json({ success: false, message: "Item not in cart" });
    }

    // `wanted`, not the raw body value: from here on every comparison is against a
    // number that is known to be one.
    if (wanted <= 0) {
      cart.items = cart.items.filter((it) => {
        const sameProduct = it.product.toString() === productId.toString();
        const sameSize = (it.size ?? null) === normalizedSize;
        const sameColor = (it.color ?? null) === normalizedColor;
        return !(sameProduct && sameSize && sameColor);
      });
    } else {
      // stock validation (simple vs variable)
      if (product.type === "simple") {
        if (product.stock < wanted) {
          return res.status(400).json({ success: false, message: `Stock insuffisant : seulement ${product.stock} article(s) disponible(s)` });
        }
      }

      if (product.type === "variable") {
        if (!color || !size) {
          return res.status(400).json({
            success: false,
            message: "Size and color must be selected for variable products",
          });
        }

        const variant = product.colors?.find((c) => c.hex === color || c.name === color)?.variants?.find((v) => {
          const variantSizes = (v as any)?.size;
          return Array.isArray(variantSizes) ? variantSizes.includes(size) : String(variantSizes) === String(size);
        });

        if (!variant || !variant.isActive) {
          return res.status(400).json({ success: false, message: "Selected variant is not available" });
        }

        if ((variant as any).stock < wanted) {
          return res.status(400).json({ success: false, message: `Stock insuffisant : seulement ${(variant as any).stock} article(s) disponible(s) pour cette variante` });
        }
      }

      item.quantity = wanted;
      item.price = product.price;
    }

    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock colors type");
    res.json({ success: true, data: cart });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};

export const deleteCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const size = req.query.size as string | undefined;
    const color = req.query.color as string | undefined;
    const cart = await Cart.findOne({ user: req.user!._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const targetId = req.params.productId;
    cart.items = (cart.items as any).filter((item: any) => {
      const isMatchId = item._id?.toString() === targetId;
      const isMatchProduct = item.product?.toString() === targetId;

      if (isMatchId) return false;
      if (isMatchProduct) {
        if (size !== undefined && color !== undefined) {
          return !(item.size === size && item.color === color);
        }
        if (size !== undefined) {
          return item.size !== size;
        }
        if (color !== undefined) {
          return item.color !== color;
        }
        return false;
      }
      return true;
    });

    cart.calculateTotal();
    await cart.save();
    await cart.populate("items.product", "name images price stock colors type");
    res.json({ success: true, data: cart });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};
// Clear Cart
// DELETE api/v1/cart
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await Cart.findOne({ user: req.user!._id });
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
    next(error); // status + message decided by the central error handler
  }
};

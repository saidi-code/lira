import mongoose, { type Types } from "mongoose";
import { NextFunction, Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Products.js";
import Inventory from "../models/Inventory.js";
import { asInteger, asPositiveInteger } from "../utils/validate.js";

/**
 * A sanity ceiling on a single line.
 *
 * Not a stock limit — that is checked against the product — but a bound on what a
 * cart can ask for at all, so a single request cannot create a quantity large
 * enough to be awkward to display or to reason about downstream.
 */
const MAX_CART_QUANTITY = 999;

const availableForSku = async (
  productId: mongoose.Types.ObjectId | string,
  sku: string,
  legacyAvailable: number
): Promise<number> => {
  const rows = await Inventory.find({ product: productId, sku })
    .select("quantity reserved")
    .lean();
  return rows.length
    ? rows.reduce((sum, row) => sum + row.quantity - row.reserved, 0)
    : legacyAvailable;
};
// Get User Cart
// Get /api/v1/cart
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let cart = await Cart.findOne({
      user: req.user!._id,
    }).populate("items.product", "name images featureImage subtitle price stock colors type");
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
    let sku = String(product.sku ?? "").trim();
    let legacyAvailable = Number(product.stock ?? 0);
    // The cart document is not loaded here any more. It used to be fetched up
    // front and mutated in memory, which is the read-modify-write this write
    // path has been rewritten to avoid - and loading an unsaved `new Cart()`
    // meant an add to a brand-new account began from a document that never
    // existed in the database. The write below upserts, and the document is
    // re-read once at the end to respond with.
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
      sku = String((variant as any).sku ?? "").trim();
      legacyAvailable = Number((variant as any).stock ?? 0);
      if (!sku) {
        return res.status(409).json({ success: false, message: "This variant has no SKU" });
      }
    }

    if (!sku) {
      return res.status(409).json({ success: false, message: "This product has no SKU" });
    }
    const available = await availableForSku(product._id, sku, legacyAvailable);
    if (available < quantity) {
        return res
          .status(400)
          .json({ success: false, message: `Stock insuffisant : seulement ${available} article(s) disponible(s)` });
    }

    // identity for a cart item is: (productId + size + color)
    // For simple products we normalize size/color to null so duplicates are merged correctly.
    // For variable products we MUST persist the chosen color name and size.
    const normalizedSize = product.type === "simple" ? null : (size ?? null);
    const normalizedColor = product.type === "simple" ? null : (color ?? null);



    // The write, done atomically.
    //
    // This used to read the cart, mutate the array in Node, and save it back.
    // That is a read-modify-write on a document MongoDB does not lock: two
    // overlapping adds both read the same starting quantity and the second save
    // discarded the first. Measured rather than assumed - 2 + 1 + 1 came back as
    // 3, and three parallel adds to an empty cart came back as 1.
    //
    // The wishlist's filter-guard cannot fix this, because an increment depends
    // on the value already stored. Here the increment and the total are computed
    // *inside* the database, so the quantity read is whatever was stored at the
    // moment of the write.
    //
    // Two operations, because they answer different questions:
    //   1. `$inc` the existing line if one matches. The match is the full line
    //      identity (product + size + colour), not just the product, so a
    //      customer's two sizes of one perfume stay two separate lines.
    //   2. If nothing matched (`matchedCount === 0`), push a new line. The null
    //      result *is* the signal - reading first is the race being removed.
    //
    // `upsert` also covers "no cart yet": filtering on `user` means the first
    // add creates the cart atomically rather than racing its own unique index.
    const incremented = await Cart.updateOne(
      {
        user: req.user!._id,
        items: {
          $elemMatch: {
            product: product._id,
            sku,
            size: normalizedSize,
            color: normalizedColor,
          },
        },
      },
      {
        $inc: { "items.$.quantity": quantity },
        $set: { "items.$.price": product.price, "items.$.sku": sku },
      }
    );

    if (incremented.matchedCount === 0) {
      // Ensure the cart document exists first, unconditionally.
      //
      // This has to be a separate, unfiltered upsert. A push guarded on the
      // line being absent (`items: { $not: { $elemMatch: … } }`) does not merely
      // fail to match an existing cart — with `upsert: true` it *inserts a second
      // cart document* for the same user. Verified directly: a cart already
      // holding the line came back `matchedCount: 0, upsertedCount: 1`, leaving
      // two documents. So the guard belongs on the push only, and never on the
      // upsert.
      await Cart.updateOne(
        { user: req.user!._id },
        { $setOnInsert: { user: req.user!._id, items: [] } },
        { upsert: true, setDefaultsOnInsert: true }
      );

      // Now push, guarded so only one of several concurrent adds can win. A
      // bare `{ user }` push is the same race one step later: three adds that all
      // found no matching line would all push, leaving three separate lines for
      // one product instead of one line holding the total. Measured - adds of 1,
      // 2 and 3 produced lines of 1, 2 and 3 rather than a single 6.
      //
      // `matchedCount === 0` here means a concurrent request pushed first, so
      // this one increments instead. Two updates rather than one, because a push
      // cannot express "add to the line if it exists" in a single operation.
      const pushed = await Cart.updateOne(
        {
          user: req.user!._id,
          items: {
            $not: {
              $elemMatch: {
                product: product._id,
                sku,
                size: normalizedSize,
                color: normalizedColor,
              },
            },
          },
        },
        {
          $push: {
            items: {
              product: product._id,
              sku,
              quantity,
              price: product.price,
              size: normalizedSize,
              color: normalizedColor,
            },
          },
        }
      );

      if (pushed.matchedCount === 0) {
        await Cart.updateOne(
          {
            user: req.user!._id,
            items: {
              $elemMatch: {
                product: product._id,
                sku,
                size: normalizedSize,
                color: normalizedColor,
              },
            },
          },
          {
            $inc: { "items.$.quantity": quantity },
            $set: { "items.$.price": product.price },
          }
        );
      }
    }

    // totalAmount is recomputed by the database from the lines it now holds,
    // rather than by summing an array in Node that another request may already
    // have changed under us.
    await Cart.updateOne(
      { user: req.user!._id },
      [
        {
          $set: {
            totalAmount: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$items", []] },
                  as: "line",
                  in: { $multiply: ["$$line.price", { $ifNull: ["$$line.quantity", 0] }] },
                },
              },
            },
          },
        },
      ],
      // `updatePipeline` is required, not optional: passing an array as the update
      // is otherwise rejected with "Cannot pass an array to query updates unless
      // the `updatePipeline` option is set", which surfaced as a 500 on every
      // successful add.
      { updatePipeline: true }
    );

    const cart = await Cart.findOne({ user: req.user!._id })
      .populate("items.product", "name images featureImage price stock sizes colors type");

    // remove corrupted cart items (where product reference is null/undefined)
    // to avoid populate() / client crashes
    if (cart) {
      cart.items = cart.items.filter(
        (i: any) => i?.product !== null && i?.product !== undefined,
      );
    }

    res.json({ success: true, data: cart });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};
/**
 * Recompute `totalAmount` from the lines as they stand **in the database**.
 *
 * `Cart.calculateTotal()` sums a Node-side array, and that array can be stale:
 * `updateCartItem`/`deleteCartItem` read the cart, and a concurrent `addToCart`
 * may change another line before the save. Saving the stale sum then overwrites
 * a total another request had already recalculated.
 *
 * Measured, not assumed: a forced interleaving got the quantities right 40/40
 * (Mongoose only sends dirty paths, so `save()` is not a whole-document write)
 * and the total wrong 40/40. The derived field was the casualty, not the lines.
 */
const recomputeTotal = async (user: Types.ObjectId): Promise<void> => {
  await Cart.updateOne(
    { user },
    [
      {
        $set: {
          totalAmount: {
            $sum: {
              $map: {
                input: { $ifNull: ["$items", []] },
                as: "line",
                in: { $multiply: ["$$line.price", { $ifNull: ["$$line.quantity", 0] }] },
              },
            },
          },
        },
      },
    ],
    // required, not optional: an array update is rejected without it (see addToCart)
    { updatePipeline: true }
  );
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
      let sku = String(product.sku ?? item.sku ?? "").trim();
      let legacyAvailable = Number(product.stock ?? 0);
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

        sku = String((variant as any).sku ?? item.sku ?? "").trim();
        legacyAvailable = Number((variant as any).stock ?? 0);
      }

      if (!sku) return res.status(409).json({ success: false, message: "This product variant has no SKU" });
      const available = await availableForSku(product._id, sku, legacyAvailable);
      if (available < wanted) {
        return res.status(400).json({ success: false, message: `Stock insuffisant : seulement ${available} article(s) disponible(s)` });
      }

      item.quantity = wanted;
      item.price = product.price;
      item.sku = sku;
    }

    await cart.save();
    await recomputeTotal(req.user!._id);

    const fresh = await Cart.findById(cart._id).populate(
      "items.product",
      "name images featureImage price stock colors type"
    );
    res.json({ success: true, data: fresh });
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
    if (typeof targetId !== "string" || targetId.length < 12) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    // Removing a line used to be: filter the array in Node, then `save()`.
    // Reassigning `items` makes Mongoose write the *whole* array, so that write
    // reverts every line another request changed in between. Measured: an
    // interleaved add to a different line survived `updateCartItem` (which writes
    // a scalar `items.N.quantity` path) but was lost here — 1 instead of 4.
    // `$pull` removes only what it matches and leaves the rest untouched.
    //
    // The two conditions mirror the original filter: an `_id` match wins
    // outright, otherwise the product match narrows by whichever of size/color
    // the caller supplied — neither means "every line of this product".
    const productMatch: Record<string, unknown> = { product: targetId };
    if (size !== undefined) productMatch.size = size;
    if (color !== undefined) productMatch.color = color;

    await Cart.updateOne(
      { user: req.user!._id },
      { $pull: { items: { $or: [{ _id: targetId }, productMatch] } } } as any
    );
    await recomputeTotal(req.user!._id);

    const fresh = await Cart.findById(cart._id).populate(
      "items.product",
      "name images featureImage price stock colors type"
    );
    res.json({ success: true, data: fresh });
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

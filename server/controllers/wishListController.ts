import { NextFunction, Request, Response } from "express";
import WishList from "../models/WishList.js";
import Product from "../models/Products.js";

export const getWishList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // `findOneAndUpdate` with `upsert`, not find-then-`create`.
    //
    // The old shape read, found nothing, and inserted — a read-then-write race
    // against the unique index on `user`. Two concurrent loads (the app fires
    // this on mount, and React Query can retry) both found nothing, both tried
    // to create, and one lost with a duplicate-key error: a 409 on a plain GET
    // of an empty wishlist, for the customer with the newest account.
    //
    // Upserting is a single atomic operation, so the document is created once
    // and every caller gets the same one back. A GET still writes, but it can
    // no longer fail.
    const wishList = await WishList.findOneAndUpdate(
      { user: req.user!._id },
      { $setOnInsert: { user: req.user!._id, items: [] } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("items.product", "name images subtitle price category stock colors type")
      .lean();

    return res.json({ success: true, data: wishList });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};

export const addToWishList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Make sure the list exists before the guarded write below.
    //
    // This is an unconditional upsert on `user`, so it is idempotent and safe to
    // run concurrently: the document is created once, and `$setOnInsert` means
    // an existing list is left completely untouched (an `$addToSet` here would
    // have wiped nothing but looked wrong; a plain `create` would have raced
    // the unique index on `user`).
    await WishList.findOneAndUpdate(
      { user: req.user!._id },
      { $setOnInsert: { user: req.user!._id, items: [] } },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // The duplicate guard lives in the *filter*, not in a prior `findOne`.
    //
    // `$addToSet` looks like the obvious fix here and is not: the `addedAt`
    // default makes each candidate element `{ product, addedAt: now }`
    // different from the one already stored, so MongoDB never recognises it as a
    // duplicate and happily adds a second copy. That was measured, not assumed —
    // five concurrent adds stored 4 and 7 copies.
    //
    // `{"items.product": {$ne: productId}}` matches only when no element has
    // this product, and the filter is evaluated as part of the same atomic
    // update. So the check and the write cannot come apart, which is the whole
    // point: the old find-then-push let two requests both see "not in the list"
    // and both push. No unique index can catch this — MongoDB cannot enforce
    // uniqueness across the `product` field of an array of subdocuments.
    const wishList = await WishList.findOneAndUpdate(
      { user: req.user!._id, "items.product": { $ne: productId } },
      { $push: { items: { product: productId } } },
      { new: true }
    ).populate("items.product", "name images subtitle price category stock colors type");

    // No match means the filter was false, i.e. it is already in the list. That
    // is now a truthful answer rather than a guess made before the write.
    if (!wishList) {
      const current = await WishList.findOne({ user: req.user!._id })
        .populate("items.product", "name images subtitle price category stock colors type")
        .lean();
      return res.status(400).json({ success: false, message: "Product already in wish list", data: current });
    }

    return res.json({ success: true, data: wishList });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};

export const removeFromWishList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const wishList = await WishList.findOneAndUpdate(
      { user: req.user!._id },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate("items.product", "name images subtitle price category stock colors type");

    if (!wishList) {
      return res.status(404).json({ success: false, message: "Wish List not found" });
    }

    return res.json({ success: true, data: wishList });
  } catch (error: any) {
    next(error); // status + message decided by the central error handler
  }
};

export default { getWishList, addToWishList, removeFromWishList };
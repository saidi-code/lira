import { Request, Response } from "express";
import WishList from "../models/WishList.js";
import Product from "../models/Products.js";

export const getWishList = async (req: Request, res: Response) => {
  try {
    let wishList = await WishList.findOne({ user: req.user!._id })
      .populate("items.product", "name images subtitle price category stock colors type")
      .lean();

    if (!wishList) {
      wishList = await WishList.create({ user: req.user!._id, items: [] });
    }

    return res.json({ success: true, data: wishList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishList = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Check if already in wishlist
    const existing = await WishList.findOne({
      user: req.user!._id,
      "items.product": productId,
    }).lean();

    if (existing) {
      return res.status(400).json({ success: false, message: "Product already in wish list" });
    }

    const wishList = await WishList.findOneAndUpdate(
      { user: req.user!._id },
      { $push: { items: { product: productId } } },
      { new: true, upsert: true }
    ).populate("items.product", "name images subtitle price category stock colors type");

    return res.json({ success: true, data: wishList });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishList = async (req: Request, res: Response) => {
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getWishList, addToWishList, removeFromWishList };
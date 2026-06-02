import { Request, Response } from "express";
import WishList from "../models/WishList.js";
import Product from "../models/Products.js";
const getWishList = async (req: Request, res: Response) => {
    
  try {
    let wishList = await WishList.findOne({ user: req.user._id }).populate(   "items.product", "name images price category");
    if (!wishList) {
      wishList = await WishList.create({ user: req.user._id, items: [] });
      res.status(201).json({ success: true, data: wishList });
      return;
    }
    res.json({ success: true, data: wishList });
    } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
    }
};

export const addToWishList = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    let wishList = await WishList.findOne({ user: req.user._id });
    if (!wishList) {
      wishList = new WishList({ user: req.user._id, items: [] });
    }
    if (wishList.items.some((item) => item.product.toString() === productId)) {
      return res.status(400).json({ success: false, message: "Product already in wish list" });
    }
    wishList.items.push({ product: productId });
    await wishList.save();
    await wishList.populate("items.product", "name images price category");
    res.json({ success: true, data: wishList });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
    }
};

export const removeFromWishList = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const wishList = await WishList.findOne({ user: req.user._id });
        if (!wishList) {
            return res.status(404).json({ success: false, message: "Wish List not found" });
        }
        if (!wishList.items.some((item) => item.product.toString() === productId)) {
            return res.status(404).json({ success: false, message: "Product not in wish list" });
        }
        wishList.items = wishList.items.filter((item) => item.product.toString() !== productId);
        await wishList.save();
        await wishList.populate("items.product", "name images price category");
        res.json({ success: true, data: wishList });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { getWishList, addToWishList, removeFromWishList };
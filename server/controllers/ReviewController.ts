// controllers/ReviewController.ts
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import { asInteger } from "../utils/validate.js";

// ==================== TYPES ====================
// The `req.user` shape now comes from the Express global augmentation in
// types/express.d.ts. This per-controller copy declared `role?: string`, which
// is not assignable to `UserRole` — so it silently disagreed with the schema
// that `authorize()` actually checks against.

interface ProductParams {
  id: string;
}

interface ReviewParams {
  id: string;
}

interface CreateReviewBody {
  rating: number;
  comment?: string;
}

// ==================== GET PRODUCT REVIEWS ====================
// @desc    Get all reviews for a product (+ average rating)
// @route   GET /api/reviews/product/:id
// @access  Public
export const getProductReviews = async (
  req: Request<ProductParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const reviews = await Review.find({ product: id })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .lean();

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: Math.round(averageRating * 10) / 10,
      data: reviews,
    });
  } catch (error) {
    console.error("ReviewController failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching reviews",
    });
  }
};

// ==================== CREATE / UPDATE REVIEW ====================
// @desc    Create the user's review for a product (upsert — one per user)
// @route   POST /api/reviews/product/:id
// @access  Private
export const upsertReview = async (
  req: Request & Request<ProductParams>,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body as CreateReviewBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    // Validated rather than compared. `!rating || rating < 1 || rating > 5` is three
    // coercing checks: "abc" makes every one of them false, so a string rating
    // passed straight through and was stored as NaN. A fraction like 2.7 passed
    // too. See utils/validate.ts.
const validRating = asInteger(rating, "rating", { min: 1, max: 5 });

    const review = await Review.findOneAndUpdate(
      { user: req.user!._id, product: id },
      { rating: validRating, comment: comment ?? "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: "Review saved successfully",
      data: review,
    });
  } catch (error) {
    // Forwarded rather than answered here: a validation failure throws an
    // AppError carrying a 400, and a local `catch` would report the caller's
    // mistake as a server fault.
    next(error);
  }
};

// ==================== GET MY REVIEWS ====================
// @desc    Get logged-in user's reviews (with product info)
// @route   GET /api/reviews/my
// @access  Private
export const getMyReviews = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const reviews = await Review.find({ user: req.user!._id })
      .populate("product", "name images price")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("ReviewController failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching your reviews",
    });
  }
};

// ==================== DELETE REVIEW ====================
// @desc    Delete a review (owner or admin)
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (
  req: Request & Request<ReviewParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const isOwner = review.user.toString() === req.user!._id.toString();
    const isAdmin = req.user!.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("ReviewController failed:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting review",
    });
  }
};
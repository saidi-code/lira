// controllers/ReviewController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";

// ==================== TYPES ====================
interface AuthUser {
  _id: mongoose.Types.ObjectId;
  role?: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

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
    return res.status(500).json({
      success: false,
      message: "Error fetching reviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== CREATE / UPDATE REVIEW ====================
// @desc    Create the user's review for a product (upsert — one per user)
// @route   POST /api/reviews/product/:id
// @access  Private
export const upsertReview = async (
  req: AuthRequest & Request<ProductParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body as CreateReviewBody;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user!._id, product: id },
      { rating, comment: comment ?? "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({
      success: true,
      message: "Review saved successfully",
      data: review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error saving review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET MY REVIEWS ====================
// @desc    Get logged-in user's reviews (with product info)
// @route   GET /api/reviews/my
// @access  Private
export const getMyReviews = async (
  req: AuthRequest,
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
    return res.status(500).json({
      success: false,
      message: "Error fetching your reviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== DELETE REVIEW ====================
// @desc    Delete a review (owner or admin)
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = async (
  req: AuthRequest & Request<ReviewParams>,
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
    return res.status(500).json({
      success: false,
      message: "Error deleting review",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
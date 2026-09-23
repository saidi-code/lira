import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getProductReviews,
  upsertReview,
  getMyReviews,
  deleteReview,
} from "../controllers/ReviewController.js";

const router = express.Router();

// Public: reviews for a product
router.get("/product/:id", getProductReviews);

// Private: create/replace my review for a product
router.post("/product/:id", protect, upsertReview);

// Private: my reviews
router.get("/my", protect, getMyReviews);

// Private: delete a review (owner or admin)
router.delete("/:id", protect, deleteReview);

export default router;

// Method  Endpoint                      Description              Access
// GET     /api/reviews/product/:id      product reviews + avg    Public
// POST    /api/reviews/product/:id      upsert my review         Private
// GET     /api/reviews/my               my reviews               Private
// DELETE  /api/reviews/:id              delete a review          Private
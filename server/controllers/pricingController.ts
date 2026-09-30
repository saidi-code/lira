// controllers/pricingController.ts
import { Request, Response } from "express";
import { PRICING } from "../config/pricing.js";

// ==================== GET PRICING ====================
// @desc    Pricing config (shipping fee + tax rate) so clients can *display*
//          the same numbers the server will charge.
// @route   GET /api/v1/pricing
// @access  Public
export const getPricing = (_req: Request, res: Response): Response => {
  return res.status(200).json({ success: true, data: PRICING });
};

export default getPricing;

import express from "express";
import { getPricing } from "../controllers/pricingController.js";

const router = express.Router();

// Public: lets clients display shipping/tax without duplicating the rules.
router.get("/", getPricing);

export default router;

import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import { getAdminStats } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);

export default router;

// Method  Endpoint             Description        Access
// GET     /api/admin/stats     dashboard stats    Admin
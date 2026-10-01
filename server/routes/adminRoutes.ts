import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getAdminStats,
  listUsers,
  updateUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

// `manager` is deliberately NOT here: §10 scopes role changes to `admin`.
router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/users", listUsers);
router.put("/users/:id/role", updateUserRole);

export default router;

// Method  Endpoint             Description        Access
// GET     /api/admin/stats     dashboard stats    Admin
import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
} from "../controllers/OrderController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

// User routes
router.post("/", createOrder);
router.get("/my", getMyOrders);           // paginated
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);

// Admin routes
router.get("/",authorize("admin") , getAllOrders);     // paginated
router.put("/:id/status", authorize("admin"), updateOrderStatus);
router.delete("/:id", authorize("admin"), deleteOrder);

export default router;
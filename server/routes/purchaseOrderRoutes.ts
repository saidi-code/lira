// routes/purchaseOrderRoutes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrder,
  listPurchaseOrders,
  receiveStock,
} from "../controllers/purchaseOrderController.js";

const router = express.Router();

// Purchasing is a management concern; clerks book stock, they do not raise POs.
router.use(protect, authorize("admin", "manager"));

router.get("/", listPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.post("/", createPurchaseOrder);
router.put("/:id/cancel", cancelPurchaseOrder);
router.post("/:id/receive", receiveStock);

export default router;
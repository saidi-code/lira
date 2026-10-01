// routes/transferRoutes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  createTransfer,
  getTransfer,
  listTransfers,
  updateTransferStatus,
} from "../controllers/transferController.js";

const router = express.Router();

// `warehouse_staff` is included here: physically moving boxes is their job.
router.use(protect, authorize("admin", "manager", "warehouse_staff"));

router.get("/", listTransfers);
router.get("/:id", getTransfer);
router.post("/", createTransfer);
router.put("/:id/status", updateTransferStatus);

export default router;
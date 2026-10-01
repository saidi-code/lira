// routes/supplierRoutes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  createSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from "../controllers/supplierController.js";

const router = express.Router();

// AGENT.md §10: suppliers are a purchasing concern, not a customer one.
router.use(protect, authorize("admin", "manager"));

router.get("/", listSuppliers);
router.get("/:id", getSupplier);
router.post("/", createSupplier);
router.put("/:id", updateSupplier);

export default router;
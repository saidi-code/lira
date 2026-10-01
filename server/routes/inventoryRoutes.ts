// routes/inventoryRoutes.ts
// ==========================================
// Roles per AGENT.md §10: reads are open to warehouse staff, adjustments to
// admins and managers only — staff move stock, they do not re-price it.
// ==========================================
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  adjustStock,
  listInventory,
  listMovements,
  lowStock,
  productAvailability,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.use(protect);

router.get("/low-stock", authorize("admin", "manager", "warehouse_staff"), lowStock);
router.get("/movements", authorize("admin", "manager", "warehouse_staff"), listMovements);
router.get("/", authorize("admin", "manager", "warehouse_staff"), listInventory);

// Declared last: "/low-stock" and "/movements" would otherwise be swallowed by
// "/:productId", which is a legal id shape.
router.get("/:productId", authorize("admin", "manager", "warehouse_staff"), productAvailability);

router.post("/adjust", authorize("admin", "manager"), adjustStock);

export default router;
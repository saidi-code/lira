// routes/warehouseRoutes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getWarehouse,
  listWarehouseChoices,
  listWarehouses,
  setDefaultWarehouse,
} from "../controllers/warehouseController.js";

const router = express.Router();

router.use(protect);

router.get("/choices", authorize("admin", "manager", "warehouse_staff"), listWarehouseChoices);
router.get("/", authorize("admin", "manager"), listWarehouses);
router.get("/:id", authorize("admin", "manager"), getWarehouse);
router.post("/:id/default", authorize("admin", "manager"), setDefaultWarehouse);

export default router;

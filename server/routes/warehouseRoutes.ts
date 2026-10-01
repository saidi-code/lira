// routes/warehouseRoutes.ts
import express from "express";
import { protect, authorize } from "../middlewares/auth.js";
import {
  getWarehouse,
  listWarehouses,
  setDefaultWarehouse,
} from "../controllers/warehouseController.js";

const router = express.Router();

router.use(protect, authorize("admin", "manager"));

router.get("/", listWarehouses);
router.get("/:id", getWarehouse);
router.post("/:id/default", setDefaultWarehouse);

export default router;
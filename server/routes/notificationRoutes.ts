import express from "express";
import { authorize, protect } from "../middlewares/auth.js";
import {
  broadcastNotification,
  listMyNotifications,
  markNotificationRead,
  registerPushDevice,
  removePushDevice,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/my", protect, authorize("user"), listMyNotifications);
router.post("/push-device", protect, authorize("user"), registerPushDevice);
// A device may be opted out after its account role changes; the controller still
// deletes only a token owned by the authenticated account.
router.delete("/push-device", protect, removePushDevice);
router.patch("/:id/read", protect, authorize("user"), markNotificationRead);
router.post("/broadcast", protect, authorize("admin", "manager"), broadcastNotification);

export default router;

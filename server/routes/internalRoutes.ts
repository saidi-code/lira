// routes/internalRoutes.ts
import express from "express";
import { releaseExpiredOrdersHandler } from "../controllers/internalController.js";

const router = express.Router();

// Deliberately NOT behind `protect`: the caller is a scheduler, not a user.
// The handler requires a matching `x-cron-secret` and returns 503 when
// CRON_SECRET is unset, so this is closed by default.
router.post("/orders/release-expired", releaseExpiredOrdersHandler);

export default router;
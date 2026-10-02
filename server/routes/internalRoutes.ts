// routes/internalRoutes.ts
import express from "express";
import { releaseExpiredOrdersHandler } from "../controllers/internalController.js";

const router = express.Router();

// Deliberately NOT behind `protect`: the caller is a scheduler, not a user.
// The handler requires a matching secret (`x-cron-secret`, or
// `Authorization: Bearer …` which is what Vercel Cron sends by itself) and
// returns 503 when CRON_SECRET is unset, so this is closed by default.
//
// GET is registered alongside POST purely because Vercel Cron only issues GET.
// The sweep is idempotent, so a scheduler retrying a GET cannot release an
// order twice.
router.post("/orders/release-expired", releaseExpiredOrdersHandler);
router.get("/orders/release-expired", releaseExpiredOrdersHandler);

export default router;
// controllers/internalController.ts
// ==========================================
// SYSTEM / SCHEDULED ENDPOINTS
// ==========================================
// A cron caller has no Clerk session, so these cannot sit behind `protect`.
// They are guarded by a shared secret instead, and they are *disabled* (503)
// until that secret is configured — an unset secret must never mean "open".
// ==========================================
import crypto from "node:crypto";
import { Request, Response } from "express";
import {
  expiryStore,
  releaseExpiredOrders,
} from "../services/orderLifecycleService.js";

/** Length-agnostic, constant-time compare so the secret cannot be probed. */
const secretMatches = (provided: string, expected: string): boolean =>
  crypto.timingSafeEqual(
    crypto.createHash("sha256").update(provided).digest(),
    crypto.createHash("sha256").update(expected).digest()
  );

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// ==================== RELEASE EXPIRED UNPAID ORDERS ====================
// @desc    Cancel unpaid online orders past their payment window and return
//          their stock to the shelf (AGENT.md §9, the `release` movement).
//          Idempotent and safe to run concurrently.
// @route   POST /api/v1/internal/orders/release-expired
// @access  Shared secret (`x-cron-secret`) — no user session
export const releaseExpiredOrdersHandler = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return res.status(503).json({
      success: false,
      message: "Order sweep is disabled (set CRON_SECRET to enable it)",
    });
  }

  const provided = req.get("x-cron-secret") ?? "";
  if (!provided || !secretMatches(provided, expected)) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const limit = clamp(Number(req.query.limit) || 100, 1, 500);
    const result = await releaseExpiredOrders(expiryStore, { limit });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("releaseExpiredOrders error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error releasing expired orders" });
  }
};

export default releaseExpiredOrdersHandler;
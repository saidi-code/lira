// controllers/paymentController.ts
import { Request, Response } from "express";
import { markOrderPaid } from "../services/orderLifecycleService.js";

// ==================== CONFIRM PAYMENT (ADMIN) ====================
// @desc    Mark an order paid. Used by the admin to record a settled COD
//          delivery, and as the landing point for a payment webhook once a
//          gateway is wired in (the service is gateway-agnostic).
// @route   PUT /api/v1/orders/:id/pay
// @access  Admin
// `Record<string, string>` mirrors Express's `ParamsDictionary`, so the handler
// stays assignable to a router slot while `req.params.id` is still a string.
export const confirmPayment = async (
  req: Request<Record<string, string>, unknown, { paymentIntentId?: unknown }>,
  res: Response
): Promise<Response> => {
  try {
    const paymentIntentId =
      typeof req.body?.paymentIntentId === "string" && req.body.paymentIntentId
        ? req.body.paymentIntentId.slice(0, 200)
        : undefined;

    const result = await markOrderPaid(req.params.id, { paymentIntentId });

    if (result.ok) {
      return res.status(200).json({
        success: true,
        message: "Payment confirmed",
        data: result.order,
      });
    }

    if (result.reason === "invalid") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid order id" });
    }

    if (result.reason === "not_found") {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 409, not 400: the request is well-formed, the order is simply no longer
    // awaiting payment — already settled, refunded, or released and cancelled.
    return res.status(409).json({
      success: false,
      message:
        "Order is not awaiting payment (already paid, refunded, or cancelled)",
    });
  } catch (error) {
    console.error("confirmPayment error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error confirming payment" });
  }
};

export default confirmPayment;
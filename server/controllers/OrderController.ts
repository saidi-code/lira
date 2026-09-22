import mongoose from "mongoose";
import { Request, Response } from "express";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Address from "../models/Address.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

// ==================== CREATE ORDER ====================
// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      items,
      shippingAddressId,
      shippingAddress,
      paymentMethod,
      notes,
      shippingCost = 0,
      tax = 0,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // ... rest of your logic
  } catch (error) {
    // ... error handling
  }
};
// controllers/adminController.ts
import { Request, Response } from "express";
import User from "../models/User.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";

// ==================== GET ADMIN STATS ====================
// @desc    Dashboard stats (users, products, orders, revenue, recent orders)
// @route   GET /api/admin/stats
// @access  Admin
export const getAdminStats = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueAgg, recentOrders] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
          {
            $group: {
              _id: null,
              revenue: { $sum: "$totalAmount" },
            },
          },
        ]),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("user", "name email")
          .lean(),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueAgg[0]?.revenue ?? 0,
        recentOrders,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching admin stats",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
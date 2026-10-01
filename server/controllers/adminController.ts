// controllers/adminController.ts
// ==========================================
// Dashboard stats and user administration. Admin only (routes/adminRoutes.ts).
// ==========================================
import { Request, Response } from "express";
import mongoose from "mongoose";
import User, { USER_ROLES, type UserRole } from "../models/User.js";
import Product from "../models/Products.js";
import Order from "../models/Order.js";

const fail = (message: string) => ({ success: false, message });

// ==================== USER MANAGEMENT ====================

/** GET /api/admin/users — role assignment needs a user list to start from. */
export const listUsers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

    const [users, total] = await Promise.all([
      User.find()
        .select("name email image role clerkId createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch {
    return res.status(500).json(fail("Error fetching users"));
  }
};

/**
 * PUT /api/admin/users/:id/role
 *
 * The only way to change a role, and deliberately admin-only — §10 gives
 * `manager` "everything except user role changes", so this endpoint is the whole
 * of that exclusion.
 */
export const updateUserRole = async (
  req: Request<Record<string, string>, unknown, { role?: unknown }>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json(fail("Invalid user id"));
    }
    if (typeof role !== "string" || !(USER_ROLES as readonly string[]).includes(role)) {
      return res
        .status(400)
        .json(fail(`role must be one of: ${USER_ROLES.join(", ")}`));
    }

    // An admin demoting themselves would leave the system with no administrator,
    // and the next mistake would have nobody able to fix it.
    if (String(req.user?._id) === id && role !== "admin") {
      return res
        .status(409)
        .json(fail("You cannot remove your own admin role"));
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role: role as UserRole } },
      { new: true, runValidators: true }
    )
      .select("name email role")
      .lean();

    if (!user) return res.status(404).json(fail("User not found"));

    return res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      data: user,
    });
  } catch {
    return res.status(500).json(fail("Error updating user role"));
  }
};

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
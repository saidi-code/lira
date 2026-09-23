// controllers/orderController.ts
import { Request, Response } from "express";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import Address from "../models/Address.js";
import { getPagination, buildPaginationMeta } from "../utils/pagination.js";

// ==================== TYPES ====================
interface AuthUser {
  _id: mongoose.Types.ObjectId;
  role?: string;
}

interface AuthRequest extends Request {
  user?: AuthUser;
}

interface OrderItemInput {
  product: mongoose.Types.ObjectId | string;
  quantity: number;
  size?: string | null;
  color?: string | null;
}

interface ShippingAddressInput {
  type?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

interface CreateOrderBody {
  items: OrderItemInput[];
  shippingAddressId?: string;
  shippingAddress?: ShippingAddressInput;
  paymentMethod?: string;
  notes?: string;
  shippingCost?: number;
  tax?: number;
}

type OrderStatus = "placed" | "processing" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

interface UpdateOrderStatusBody {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

interface OrderParams {
  id: string;
}

interface OrderQuery {
  page?: string;
  limit?: string;
  status?: string;
  paymentStatus?: string;
}

interface OrderItemDoc {
  product: mongoose.Types.ObjectId;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  subtotal: number;
}

// ==================== CREATE ORDER ====================
// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (
  req: AuthRequest,
  res: Response
): Promise<Response> => {
  try {
    const {
      items,
      shippingAddressId,
      shippingAddress,
      paymentMethod,
      notes,
      shippingCost = 0,
      tax = 0,
    } = req.body as CreateOrderBody;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // ---------- Resolve address ----------
    let addressDoc: any = null;
    if (shippingAddressId) {
      if (!mongoose.Types.ObjectId.isValid(shippingAddressId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid shipping address id",
        });
      }
      addressDoc = await Address.findOne({
        _id: shippingAddressId,
        user: req.user!._id,
      });
      if (!addressDoc) {
        return res.status(404).json({
          success: false,
          message: "Shipping address not found",
        });
      }
    } else if (shippingAddress) {
      addressDoc = shippingAddress;
    } else {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // ---------- Validate products ----------
    const productIds = items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems: OrderItemDoc[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.product?.toString());
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }

      const quantity = Number(item.quantity) || 0;
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      if (typeof product.stock === "number" && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`,
        });
      }

      const price = product.price ?? 0;
      const itemSubtotal = price * quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0],
        price,
        quantity,
        size: item.size ?? null,
        color: item.color ?? null,
        subtotal: itemSubtotal,
      });
    }

    const finalShipping = Number(shippingCost) || 0;
    const finalTax = Number(tax) || 0;
    const totalAmount = subtotal + finalShipping + finalTax;

    const order = await Order.create({
      user: req.user!._id,
      items: orderItems,
      shippingAddress: {
        type: addressDoc.type ?? "Other",
        street: addressDoc.street,
        city: addressDoc.city,
        state: addressDoc.state,
        zipCode: addressDoc.zipCode,
        phoneNumber: addressDoc.phoneNumber,
      },
      paymentMethod: paymentMethod ?? "cash",
      paymentStatus: "pending",
      orderStatus: "placed",
      subtotal,
      shippingCost: finalShipping,
      tax: finalTax,
      totalAmount,
      notes,
    });

    for (const item of orderItems) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET MY ORDERS (PAGINATED) ====================
// @desc    Get logged-in user's orders (paginated)
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (
  req: AuthRequest & Request<{}, {}, {}, OrderQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = { user: req.user!._id };
    // Optional filter by status
    if (req.query.status) filter.orderStatus = req.query.status;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET ORDER BY ID ====================
// @desc    Get a single order
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id).populate("user", "name email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderUser = order.user as unknown as {
      _id: mongoose.Types.ObjectId;
    };
    if (
      orderUser._id.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== GET ALL ORDERS (ADMIN, PAGINATED) ====================
// @desc    Get all orders (paginated)
// @route   GET /api/orders
// @access  Admin
export const getAllOrders = async (
  req: Request<{}, {}, {}, OrderQuery>,
  res: Response
): Promise<Response> => {
  try {
    const { status, paymentStatus } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = {};
    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== UPDATE ORDER STATUS (ADMIN) ====================
// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (
  req: AuthRequest & Request<OrderParams, {}, UpdateOrderStatusBody>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== CANCEL ORDER ====================
// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
export const cancelOrder = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.user.toString() !== req.user!._id.toString() &&
      req.user!.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (["shipped", "delivered"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an order that has been shipped or delivered",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== DELETE ORDER (ADMIN) ====================
// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Admin
export const deleteOrder = async (
  req: AuthRequest & Request<OrderParams>,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
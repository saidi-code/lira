import { Request, Response } from "express";
import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import NotificationRead from "../models/NotificationRead.js";
import PushDevice from "../models/PushDevice.js";
import User from "../models/User.js";
import Product from "../models/Products.js";
import { AppError } from "../middlewares/errorHandler.js";
import { asObjectId, asString } from "../utils/validate.js";

const expoPushUrl = "https://exp.host/--/api/v2/push/send";
const isExpoToken = (token: unknown): token is string =>
  typeof token === "string" && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);

export async function registerPushDevice(req: Request, res: Response) {
  const token = req.body?.token;
  const platform = req.body?.platform;
  if (!isExpoToken(token) || !["ios", "android"].includes(platform)) {
    throw new AppError("A valid Expo push token and platform are required", { status: 400 });
  }

  await PushDevice.findOneAndUpdate(
    { token },
    { $set: { user: req.user!._id, platform } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return res.status(200).json({ success: true });
}

export async function removePushDevice(req: Request, res: Response) {
  const token = req.query?.token ?? req.body?.token;
  if (!isExpoToken(token)) throw new AppError("A valid Expo push token is required", { status: 400 });
  await PushDevice.deleteOne({ user: req.user!._id, token });
  return res.status(200).json({ success: true });
}

export async function listMyNotifications(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 30));
  const userId = req.user!._id;
  const [data, total, readCount] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Notification.countDocuments(),
    NotificationRead.countDocuments({ user: userId }),
  ]);
  const receipts = data.length
    ? await NotificationRead.find({ user: userId, notification: { $in: data.map((item) => item._id) } })
        .select("notification")
        .lean()
    : [];
  const readIds = new Set(receipts.map((receipt) => String(receipt.notification)));

  return res.json({
    data: data.map((item) => ({ ...item, isRead: readIds.has(String(item._id)) })),
    unreadCount: Math.max(0, total - readCount),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function markNotificationRead(req: Request, res: Response) {
  const id = asObjectId(req.params.id, "notification id");
  const exists = await Notification.exists({ _id: id });
  if (!exists) throw new AppError("Notification not found", { status: 404 });
  await NotificationRead.updateOne(
    { notification: id, user: req.user!._id },
    { $setOnInsert: { notification: id, user: req.user!._id } },
    { upsert: true }
  );
  return res.json({ success: true });
}

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  sound: "default";
  channelId: "promotions";
  data: { notificationId: string; type: string; productId?: string };
};

async function sendExpoMessages(messages: ExpoPushMessage[]) {
  let accepted = 0;
  let failed = 0;
  for (let offset = 0; offset < messages.length; offset += 100) {
    const batch = messages.slice(offset, offset + 100);
    const response = await fetch(expoPushUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      failed += batch.length;
      console.error("Expo push request failed", response.status, await response.text());
      continue;
    }
    const payload = (await response.json()) as {
      data?: Array<{ status?: string; details?: { error?: string } }>;
    };
    const tickets = payload.data ?? [];
    accepted += tickets.filter((ticket) => ticket.status === "ok").length;
    failed += batch.length - tickets.filter((ticket) => ticket.status === "ok").length;
    const invalidTokens = tickets.flatMap((ticket, index) =>
      ticket.details?.error === "DeviceNotRegistered" ? [batch[index]?.to] : []
    );
    if (invalidTokens.length) await PushDevice.deleteMany({ token: { $in: invalidTokens } });
  }
  return { accepted, failed };
}

export async function broadcastNotification(req: Request, res: Response) {
  const type = req.body?.type;
  if (type !== "promotion" && type !== "new_product") {
    throw new AppError("type must be promotion or new_product", { status: 400 });
  }
  const title = asString(req.body?.title, "title", { maxLength: 120 });
  const body = asString(req.body?.body, "body", { maxLength: 500 });

  let productId: mongoose.Types.ObjectId | undefined;
  if (req.body?.productId) {
    productId = new mongoose.Types.ObjectId(asObjectId(req.body.productId, "productId"));
    const product = await Product.findOne({ _id: productId, isActive: true }).select("_id").lean();
    if (!product) throw new AppError("Active product not found", { status: 404 });
  }
  if (type === "new_product" && !productId) {
    throw new AppError("productId is required for a new-product notification", { status: 400 });
  }

  const notification = await Notification.create({
    type,
    title,
    body,
    ...(productId ? { productId } : {}),
    sentBy: req.user!._id,
  });
  const customers = await User.find({ role: "user" }).select("_id").lean();
  const devices = customers.length
    ? await PushDevice.find({ user: { $in: customers.map((customer) => customer._id) } })
        .select("token")
        .lean()
    : [];
  const messages = devices.map((device) => ({
    to: device.token,
    title,
    body,
    sound: "default" as const,
    channelId: "promotions" as const,
    data: {
      notificationId: String(notification._id),
      type,
      ...(productId ? { productId: String(productId) } : {}),
    },
  }));

  let delivery = { accepted: 0, failed: 0 };
  if (messages.length) {
    try {
      delivery = await sendExpoMessages(messages);
    } catch (error) {
      console.error("Expo push delivery failed", error);
      delivery.failed = messages.length;
    }
  }

  return res.status(201).json({
    success: true,
    notification,
    recipients: devices.length,
    delivery,
  });
}

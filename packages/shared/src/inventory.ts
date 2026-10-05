export const MOVEMENT_TYPES = [
  "in",
  "out",
  "reserve",
  "release",
  "commit",
  "transfer_out",
  "transfer_in",
  "adjust",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const PO_STATUSES = [
  "draft",
  "ordered",
  "partially_received",
  "received",
  "cancelled",
] as const;

export type PurchaseOrderStatus = (typeof PO_STATUSES)[number];

export const TRANSFER_STATUSES = [
  "draft",
  "in_transit",
  "completed",
  "cancelled",
] as const;

export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

export const ORDER_STATUSES = [
  "placed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "stripe"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

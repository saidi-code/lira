// config/orders.ts
// ==========================================
// ORDER LIFECYCLE WINDOWS
// ==========================================
// How long an order may hold its stock while the customer is still paying.
//
// Stock is deducted the moment an order is created, so an abandoned online
// checkout would otherwise reserve units forever: the product shows "in stock"
// in nobody's cart and out of stock on the storefront. AGENT.md §9 names this
// case — the `release` movement, "cancel / reservation expired".
//
// COD is deliberately out of scope. `cash` orders are paid when they arrive, so
// they are real orders holding stock, not abandoned checkouts; only methods that
// must be paid up front are released (see AWAITING_ONLINE_PAYMENT_METHODS).
// ==========================================

/** Parses an env override, rejecting NaN and negatives. */
const envNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

/**
 * Payment methods that must be paid *before* the order is fulfilled. Anything not
 * listed here (today: `cash`) is settled on delivery and is never expired.
 */
export const AWAITING_ONLINE_PAYMENT_METHODS: readonly string[] = ["stripe"];

export const ORDER_CONFIG = {
  /**
   * Minutes an online order may stay unpaid before its stock is released.
   * `0` disables the sweep.
   */
  paymentWindowMinutes: envNumber(process.env.PAYMENT_WINDOW_MINUTES, 60),
} as const;

/** Orders created before this instant are past their payment window. */
export const paymentExpiryCutoff = (now: Date = new Date()): Date =>
  new Date(now.getTime() - ORDER_CONFIG.paymentWindowMinutes * 60_000);

/** True when the sweep is configured to do anything at all. */
export const isPaymentSweepEnabled = () =>
  ORDER_CONFIG.paymentWindowMinutes > 0 &&
  AWAITING_ONLINE_PAYMENT_METHODS.length > 0;

export default ORDER_CONFIG;
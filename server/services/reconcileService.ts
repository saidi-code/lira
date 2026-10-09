// services/reconcileService.ts
// ==========================================
// RECONCILIATION (AGENT.md §9)
// ==========================================
// `Product.stock` is a denormalised convenience for the catalogue; the ledger in
// `SkuInventory` + `StockMovement` is the truth. Drift between them means a write
// bypassed `inventoryService` — usually a hand-edited document.
//
// Both sides are compared as *availability* (§9): `Σ(quantity − reserved)` versus
// `Product.stock`. On-shelf quantity is deliberately not compared — pending orders
// make the two differ legitimately, and flagging that would drown real problems.
//
// The rule lives here, not in the script, so it can be unit-tested: importing
// scripts/reconcileStock.ts would run its `main()` and open a database
// connection.
// ==========================================

export interface DriftRow {
  productId: string;
  name: string;
  /** Σ(quantity − reserved) across every warehouse — what is sellable. */
  ledger: number;
  /** What `Product.stock` currently claims. */
  catalogue: number;
  delta: number;
}

/** Below this, the two figures are "the same" — keeps float noise out of the report. */
export const EPSILON = 1e-9;

export interface ReconciliationInput {
  product: { _id: unknown; name?: string; stock?: number };
  ledger: number;
}

/**
 * Compares the catalogue against the ledger and returns only what disagrees.
 *
 * A product with no inventory row counts as `ledger: 0`, so a product whose rows
 * were deleted surfaces as drift instead of silently reporting the catalogue
 * figure.
 */
export const findDrift = (rows: ReconciliationInput[]): DriftRow[] =>
  rows
    .map((row) => {
      const catalogue = Number(row.product.stock ?? 0);
      return {
        productId: String(row.product._id),
        name: row.product.name ?? "",
        ledger: row.ledger,
        catalogue,
        delta: row.ledger - catalogue,
      };
    })
    .filter((row) => Math.abs(row.delta) > EPSILON);

// ================= STRANDED RESERVATIONS =================
//
// When `commit` was folded into `out`, shipping an order took the units off the
// shelf but never cleared the hold. Every order shipped before that fix left
// `reserved` stranded: the units are physically gone, yet the row still says
// they are held, so they are neither sellable nor reconcilable.
//
// `reconcile` cannot find these on its own — it compares *availability*
// (quantity − reserved), and a stranded reservation makes both sides wrong by
// exactly the same amount. The only way to spot one is to look at orders that
// reached a shipped state and check whether their hold was ever released.

export interface StrandedOrderLine {
  product: string;
  sku?: string;
  name: string;
  quantity: number;
}

export interface StrandedOrder {
  orderId: string;
  orderNumber: string;
  warehouse: string;
  lines: StrandedOrderLine[];
  /** The `commit` movement that would settle it, if one was ever written. */
  hasCommitMovement: boolean;
}

/** Order states where the units have physically left the building. */
export const FULFILLED_STATUSES = ["shipped", "delivered"] as const;

/**
 * A shipped order is only a candidate if it actually holds stock back.
 *
 * The `reserved` figure belongs to the warehouse row, not the order, so the
 * caller supplies the per-line holds it read from `Inventory`. Lines whose hold
 * is already zero are dropped: they are either fine or a different problem, and
 * including them would have the repair decrement below zero.
 */
export const strandedReservations = (
  orders: Array<{
    orderId: string;
    orderNumber?: string | null;
    warehouse?: string | null;
    status: string;
    lines: Array<StrandedOrderLine & { reservedAtWarehouse: number }>;
    hasCommitMovement: boolean;
  }>
): StrandedOrder[] =>
  orders
    .filter((order) => (FULFILLED_STATUSES as readonly string[]).includes(order.status))
    .filter((order) => !order.hasCommitMovement)
    .map((order) => {
      const lines = order.lines
        .map((line) => ({
          product: line.product,
          name: line.name,
          // Only the part that is genuinely still held can be released. If the
          // hold is short, releasing the full order quantity would drive
          // `reserved` negative and corrupt a row that is otherwise healthy.
          quantity: Math.min(line.quantity, line.reservedAtWarehouse),
        }))
        .filter((line) => line.quantity > 0);

      return {
        orderId: order.orderId,
        orderNumber: order.orderNumber ?? order.orderId,
        warehouse: order.warehouse ?? "",
        lines,
        hasCommitMovement: false,
      };
    })
    .filter((order) => order.lines.length > 0);

/**
 * The `delta` a historical movement should have been written with.
 *
 * Historical rows predate the `delta` column. Their direction *is* recoverable
 * from `type` for every type that has one — with a single exception: rows
 * written under the old `transfer` type, where the sign of the original
 * quantity was the only record of direction and the schema rejected it. Those
 * are reported as unrecoverable rather than guessed at, because a wrong guess
 * silently corrupts the audit trail.
 */
export const recoverableDelta = (
  type: string,
  quantity: number
): number | null => {
  if (type === "transfer") return null; // direction was never stored

  const table: Record<string, (q: number) => number> = {
    in: (q) => q,
    out: (q) => -q,
    reserve: () => 0,
    release: () => 0,
    commit: (q) => -q,
    transfer_out: (q) => -q,
    transfer_in: (q) => q,
  };

  const fn = table[type];
  if (!fn) return null;
  return fn(Math.abs(quantity));
};

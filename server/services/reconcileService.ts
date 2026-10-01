// services/reconcileService.ts
// ==========================================
// RECONCILIATION (AGENT.md §9)
// ==========================================
// `Product.stock` is a denormalised convenience for the catalogue; the ledger in
// `Inventory` + `StockMovement` is the truth. Drift between them means a write
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
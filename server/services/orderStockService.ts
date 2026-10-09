// services/orderStockService.ts
// ==========================================
// ORDER ↔ LEDGER BRIDGE
// ==========================================
// Checkout must move stock and leave an audit trail at the same time. This is the
// only place that knows how the two are kept in step:
//
//   order placed   -> reserve   (hold the units)          + Product.stock -= n
//   order cancelled-> release   (give the hold back)      + Product.stock += n
//   order shipped  -> commit    (units leave the shelf)   Product.stock unchanged
//
// `Product.stock` therefore means *availability* (Σ quantity − Σ reserved), which
// is what the storefront has always read — so the client needs no change, and
// §11's "Product.stock = Σ Inventory.quantity" is corrected to match.
//
// Ordering matters: the proven atomic guard on `Product.stock` runs first, so
// overselling stays impossible even while the two sources drift. If the ledger
// then refuses the movement, the mirror is rolled back and the order fails — a
// spurious failure is always preferable to selling stock that is not there.
// ==========================================
import mongoose, { ClientSession } from "mongoose";
import Product from "../models/Products.js";
import Warehouse from "../models/Warehouse.js";
import {
  InsufficientStockError,
  reserve as ledgerReserve,
  release as ledgerRelease,
  commit as ledgerCommit,
} from "./inventoryService.js";

export interface OrderStockLine {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  /** Product SKU for simple products; selected color/size SKU otherwise. */
  sku?: string;
}

/**
 * The warehouse an order draws from — taken from the order document itself.
 *
 * Release and commit must undo a hold in the row it was taken in. Falling back to
 * "the current default" would, for any order placed before a default changed,
 * credit a different warehouse and leave the original reservation stranded.
 */
export type OrderWarehouse =
  | mongoose.Types.ObjectId
  | string
  | null
  | undefined;

let warnedAboutLegacyOrder = false;

/**
 * The warehouse a release or commit may touch.
 *
 * An order that carries its own allocation uses that, always. An order that
 * predates the stamp falls back to the current default: there is no way to know
 * where its hold actually is, and leaving the units stranded is strictly worse
 * than a best guess. It is warned about once, because it is a migration artefact
 * and should disappear as orders are placed normally.
 */
const resolveOrderWarehouse = async (
  stamped: OrderWarehouse
): Promise<mongoose.Types.ObjectId | string | null> => {
  if (stamped) return stamped;

  const fallback = await resolveDefaultWarehouse();
  if (fallback && !warnedAboutLegacyOrder) {
    warnedAboutLegacyOrder = true;
    console.warn(
      "[stock] An order has no recorded warehouse — releasing against the " +
        "current default. Orders placed before the allocation stamp was added " +
        "cannot be resolved exactly."
    );
  }
  return fallback;
};

/**
 * Which ledger movement an order-status change implies.
 *
 * `commit` must happen exactly once, when an order leaves the "holding" states
 * for the first time — `shipped → delivered` must not deduct a second time, and a
 * cancelled order has already been released.
 */
export type OrderStockTransition = "commit" | "none";

export const transitionFor = (
  from: string,
  to: string | undefined
): OrderStockTransition => {
  if (!to || to === from) return "none";
  if (from === "cancelled") return "none"; // already released on cancel
  const shipped = to === "shipped" || to === "delivered";
  const held = from === "placed" || from === "processing";
  return shipped && held ? "commit" : "none";
};

/** The warehouse orders draw from, or `null` when the ledger is not set up yet. */
const resolveDefaultWarehouse = async (): Promise<mongoose.Types.ObjectId | null> => {
  const warehouse = await Warehouse.findOne({
    isDefault: true,
    isActive: true,
  })
    .select("_id")
    .lean();
  return warehouse ? (warehouse._id as mongoose.Types.ObjectId) : null;
};

let warnedAboutMissingWarehouse = false;

/**
 * Orders are placed against the default warehouse. Without one seeded we fall
 * back to the pre-ledger behaviour and say so loudly, rather than failing every
 * checkout on a fresh database.
 */
const requireWarehouse = async (): Promise<mongoose.Types.ObjectId | null> => {
  const warehouse = await resolveDefaultWarehouse();
  if (!warehouse && !warnedAboutMissingWarehouse) {
    warnedAboutMissingWarehouse = true;
    console.warn(
      "[stock] No default warehouse found — falling back to Product.stock only. " +
        "Run `npm run seed:warehouses` to start recording movements."
    );
  }
  return warehouse;
};

/** Atomic guard on the catalogue figure; the ledger mirror follows from it. */
const takeFromAvailability = async (
  line: OrderStockLine,
  session?: ClientSession
): Promise<boolean> => {
  const updated = await Product.findOneAndUpdate(
    { _id: line.product, stock: { $gte: line.quantity } },
    { $inc: { stock: -line.quantity } },
    { new: true, ...(session ? { session } : {}) }
  );
  return Boolean(updated);
};

const giveBackToAvailability = async (
  line: OrderStockLine,
  session?: ClientSession
): Promise<void> => {
  await Product.updateOne(
    { _id: line.product },
    { $inc: { stock: line.quantity } },
    session ? { session } : {}
  );
};

/**
 * Order placed: hold the units and mirror the hold out of availability.
 *
 * Returns the lines it actually held, so a caller compensating after a later
 * failure knows exactly what to undo.
 */
export const reserveForOrder = async (
  lines: OrderStockLine[],
  reference: string,
  session?: ClientSession
): Promise<{
  reserved: OrderStockLine[];
  warehouse: mongoose.Types.ObjectId | null;
}> => {
  const warehouse = await requireWarehouse();
  const reserved: OrderStockLine[] = [];

  try {
    for (const line of lines) {
      // SKU lines are guarded by the SKU/warehouse ledger. Legacy order lines
      // without a SKU retain their old product-level stock path until migrated.
      if (!line.sku && !(await takeFromAvailability(line, session))) {
        throw new InsufficientStockError(`Not enough stock for ${line.name}`);
      }

      try {
        if (warehouse) {
          await ledgerReserve(
            [
              {
                product: line.product,
                sku: line.sku,
                warehouse,
                quantity: line.quantity,
                reference,
              },
            ],
            session
          );
        } else if (line.sku) {
          throw new Error("Variant-aware stock requires a configured warehouse");
        }
        reserved.push(line);
      } catch (error) {
        // The ledger refused this line — put its availability back so the two
        // sources agree, then unwind the lines already held.
        if (!line.sku) {
          await giveBackToAvailability(line, session).catch(() => undefined);
        }
        throw error;
      }
    }
  } catch (error) {
    // A later line failed: the holds this call already took must not survive it,
    // or the order fails while phantom reservations block other customers.
    if (reserved.length) {
      await releaseForOrder(reserved, reference, warehouse, session).catch(
        () => undefined
      );
    }
    throw error;
  }

  // The caller stamps this onto the order, so release and commit later have a
  // row to work from.
  return { reserved, warehouse };
};

/**
 * Order cancelled (or expired): return the hold, and the availability with it.
 *
 * Idempotent by construction — the caller reaches here through the guarded
 * `cancelAndRestock`, which only lets one request through.
 */
export const releaseForOrder = async (
  lines: OrderStockLine[],
  reference: string,
  warehouse?: OrderWarehouse,
  session?: ClientSession
): Promise<void> => {
  const target = await resolveOrderWarehouse(warehouse);

  for (const line of lines) {
    if (target) {
      await ledgerRelease(
        [{ product: line.product, sku: line.sku, warehouse: target, quantity: line.quantity, reference }],
        session
      );
      if (!line.sku) await giveBackToAvailability(line, session);
    } else if (!line.sku) {
      await giveBackToAvailability(line, session);
    } else {
      throw new Error("Cannot release SKU stock without its warehouse allocation");
    }
  }
};

/**
 * Order fulfilled: the units actually leave the shelf.
 *
 * `Product.stock` is untouched here — those units were already out of
 * availability when the order was placed — so this only closes the ledger.
 */
export const commitOrderStock = async (
  lines: OrderStockLine[],
  reference: string,
  warehouse?: OrderWarehouse,
  session?: ClientSession
): Promise<void> => {
  const target = await resolveOrderWarehouse(warehouse);
  if (!target) return;

  for (const line of lines) {
    await ledgerCommit(
      [{ product: line.product, sku: line.sku, warehouse: target, quantity: line.quantity, reference }],
      session
    );
  }
};

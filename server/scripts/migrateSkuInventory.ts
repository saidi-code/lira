import "dotenv/config";
import mongoose from "mongoose";
import { resolveDbUri } from "../config/db.js";
import Product from "../models/Products.js";
import Inventory from "../models/Inventory.js";
import SkuInventory from "../models/SkuInventory.js";
import Warehouse from "../models/Warehouse.js";
import { isDirectRun } from "../utils/isDirectRun.js";

type RawProduct = {
  _id: mongoose.Types.ObjectId;
  type?: string;
  sku?: string;
  stock?: number;
  images?: string[];
  featureImage?: string;
  colors?: Array<{
    name?: string;
    hex?: string;
    images?: string[];
    featureImage?: string;
    variants?: Array<{ size?: string | string[]; sku?: string; stock?: number; isActive?: boolean }>;
  }>;
};

type TargetRow = {
  product: mongoose.Types.ObjectId;
  sku: string;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  binLocation: string;
  migratedFromInventory?: mongoose.Types.ObjectId;
};

const id = (value: unknown) => String(value ?? "");
const available = (row: { quantity: number; reserved: number }) => row.quantity - row.reserved;

/** Resolve old order/cart color+size data to the existing catalog SKU. */
const selectedSku = (product: RawProduct, item: Record<string, any>): string | null => {
  if (item.sku && typeof item.sku === "string") return item.sku;
  if (product.type === "simple") return product.sku || null;
  const color = product.colors?.find((entry) => entry.name === item.color || entry.hex === item.color);
  const variant = color?.variants?.find((entry) => {
    const sizes = Array.isArray(entry.size) ? entry.size : [entry.size];
    return sizes.some((size) => String(size) === String(item.size));
  });
  return variant?.sku || null;
};

const migrate = async () => {
  const apply = process.argv.includes("--apply");
  await mongoose.connect(resolveDbUri(), { autoIndex: false });

  try {
    const [liveProducts, legacyRows, orders, allOrders, carts, pendingPos, pendingTransfers, defaultWarehouse, previousSnapshots] = await Promise.all([
      Product.collection.find({}).toArray() as Promise<RawProduct[]>,
      Inventory.collection.find({}).toArray(),
      mongoose.connection.collection("orders").find({ orderStatus: { $in: ["placed", "processing"] } }).toArray(),
      mongoose.connection.collection("orders").find({}).toArray(),
      mongoose.connection.collection("carts").find({}).toArray(),
      mongoose.connection.collection("purchaseorders").find({ status: { $in: ["draft", "ordered", "partially_received"] } }).toArray(),
      mongoose.connection.collection("transfers").find({ status: { $in: ["draft", "in_transit"] } }).toArray(),
      Warehouse.collection.findOne({ isDefault: true, isActive: true }),
      mongoose.connection.collection("skuInventoryMigrationSnapshots").find({}).toArray(),
    ]);
    // `structuredClone()` turns BSON ObjectIds into plain objects in some Node
    // versions. Only trust snapshots whose embedded product ID still matches;
    // use the untouched live product as the recovery source for older malformed
    // snapshots, then repair those snapshots during --apply.
    const invalidSnapshots = previousSnapshots.filter((snapshot: any) =>
      id(snapshot.product?._id) !== id(snapshot.productId)
    );
    const snapshotByProduct = new Map(
      previousSnapshots
        .filter((snapshot: any) => id(snapshot.product?._id) === id(snapshot.productId))
        .map((snapshot: any) => [id(snapshot.productId), snapshot.product as RawProduct])
    );
    const liveProductById = new Map(liveProducts.map((product) => [id(product._id), product]));
    const products = liveProducts.map((product) => snapshotByProduct.get(id(product._id)) ?? product);
    const productById = new Map(products.map((product) => [id(product._id), product]));
    const rowsByProduct = new Map<string, any[]>();
    for (const row of legacyRows) {
      const key = id(row.product);
      rowsByProduct.set(key, [...(rowsByProduct.get(key) ?? []), row]);
    }

    const reservedBySku = new Map<string, number>();
    const unresolvedOrders: string[] = [];
    for (const order of orders) {
      for (const line of order.items ?? []) {
        const product = productById.get(id(line.product));
        if (!product) continue;
        const sku = selectedSku(product, line);
        if (!sku) {
          unresolvedOrders.push(`${id(order.orderNumber || order._id)} / ${id(line.product)}`);
          continue;
        }
        const key = `${id(line.product)}::${sku}`;
        reservedBySku.set(key, (reservedBySku.get(key) ?? 0) + Number(line.quantity || 0));
      }
    }

    const targets: TargetRow[] = [];
    const blockers: string[] = [...unresolvedOrders.map((entry) => `Cannot resolve SKU for active order ${entry}`)];
    const catalogUpdates: Array<{ product: RawProduct; stock: number; colors: NonNullable<RawProduct["colors"]> }> = [];
    const orderPatches: Array<{ _id: unknown; items: any[] }> = [];
    const cartPatches: Array<{ _id: unknown; items: any[] }> = [];
    const poPatches: Array<{ _id: unknown; items: any[] }> = [];
    const transferPatches: Array<{ _id: unknown; items: any[] }> = [];

    for (const product of products) {
      const productId = id(product._id);
      const legacy = rowsByProduct.get(productId) ?? [];
      const colors = product.colors ?? [];
      const variantRows: Array<{ sku: string; available: number; reserved: number; colorIndex: number; variantIndex: number }> = [];

      if (product.type === "variable") {
        const seen = new Set<string>();
        colors.forEach((color, colorIndex) => {
          (color.variants ?? []).forEach((variant, variantIndex) => {
            const sizes = Array.isArray(variant.size) ? variant.size : [variant.size];
            if (sizes.length !== 1 || !sizes[0]) {
              blockers.push(`${product.name ?? productId}: variant ${variant.sku ?? "(no SKU)"} contains multiple or missing sizes; split its stock by size before migration.`);
              return;
            }
            const sku = String(variant.sku ?? "").trim();
            if (!sku) {
              blockers.push(`${product.name ?? productId}: a variable variant is missing its SKU.`);
              return;
            }
            if (seen.has(sku)) blockers.push(`${product.name ?? productId}: duplicate variant SKU ${sku}.`);
            seen.add(sku);
            const reserved = reservedBySku.get(`${productId}::${sku}`) ?? 0;
            const storedVariantStock = Number(variant.stock ?? 0);
            if (!Number.isInteger(storedVariantStock) || storedVariantStock < 0) {
              blockers.push(`${product.name ?? productId}: variant ${sku} has invalid stock ${String(variant.stock)}.`);
            }
            if (storedVariantStock < reserved) {
              blockers.push(`${product.name ?? productId}: active orders reserve more ${sku} units than its stored variant stock.`);
            }
            variantRows.push({
              sku,
              // Legacy checkout reserved Product.stock but left variant.stock
              // untouched, so subtract active holds to recover current availability.
              available: Math.max(0, storedVariantStock - reserved),
              reserved,
              colorIndex,
              variantIndex,
            });
          });
        });

        const stockedWarehouses = legacy.filter((row) => Number(row.quantity ?? 0) > 0 || Number(row.reserved ?? 0) > 0);
        if (stockedWarehouses.length > 1) {
          blockers.push(`${product.name ?? productId}: legacy stock is split across multiple warehouses, but the old records do not say which variant is in each warehouse.`);
          continue;
        }
        const legacyTotal = legacy.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
        const targetTotal = variantRows.reduce((sum, row) => sum + row.available + row.reserved, 0);
        if (legacy.length && legacyTotal !== targetTotal) {
          blockers.push(`${product.name ?? productId}: legacy on-hand stock (${legacyTotal}) does not equal variant available stock plus active order holds (${targetTotal}). Reconcile before migrating.`);
          continue;
        }
        const warehouse = stockedWarehouses[0]?.warehouse ?? defaultWarehouse?._id;
        if (!warehouse && targetTotal > 0) {
          blockers.push(`${product.name ?? productId}: no active default warehouse exists for its stock.`);
          continue;
        }
        if (warehouse) {
          const source = stockedWarehouses[0];
          for (const row of variantRows) {
            targets.push({
              product: product._id,
              sku: row.sku,
              warehouse,
              quantity: row.available + row.reserved,
              reserved: row.reserved,
              reorderLevel: Number(source?.reorderLevel ?? 0),
              binLocation: String(source?.binLocation ?? ""),
              ...(source?._id ? { migratedFromInventory: source._id } : {}),
            });
          }
        }
        catalogUpdates.push({
          product,
          stock: variantRows.reduce((sum, row) => sum + row.available, 0),
          colors: colors.map((color) => ({
            ...color,
            featureImage: color.featureImage || color.images?.[0] || "",
            variants: (color.variants ?? []).map((variant) => ({
              ...variant,
              size: Array.isArray(variant.size) ? variant.size[0] : variant.size,
              stock: variantRows.find((row) => row.sku === String(variant.sku ?? ""))?.available ?? Number(variant.stock ?? 0),
            })),
          })),
        });
      } else {
        const sku = String(product.sku ?? "").trim();
        if (!sku) {
          blockers.push(`${product.name ?? productId}: simple product is missing its SKU.`);
          continue;
        }
        const activeReserved = reservedBySku.get(`${productId}::${sku}`) ?? 0;
        if (!Number.isInteger(Number(product.stock ?? 0)) || Number(product.stock ?? 0) < 0) {
          blockers.push(`${product.name ?? productId}: simple product has invalid stock ${String(product.stock)}.`);
          continue;
        }
        const warehouse = legacy[0]?.warehouse ?? defaultWarehouse?._id;
        if (legacy.length) {
          for (const row of legacy) {
            if (![Number(row.quantity ?? 0), Number(row.reserved ?? 0)].every((value) => Number.isInteger(value) && value >= 0)) {
              blockers.push(`${product.name ?? productId}: a legacy inventory row has invalid quantity or reservation values.`);
            }
          }
          for (const row of legacy) {
            targets.push({
              product: product._id,
              sku,
              warehouse: row.warehouse,
              quantity: Number(row.quantity ?? 0),
              reserved: Number(row.reserved ?? 0),
              reorderLevel: Number(row.reorderLevel ?? 0),
              binLocation: String(row.binLocation ?? ""),
              migratedFromInventory: row._id,
            });
          }
        } else if (warehouse) {
          targets.push({
            product: product._id,
            sku,
            warehouse,
            quantity: Number(product.stock ?? 0) + activeReserved,
            reserved: activeReserved,
            reorderLevel: 0,
            binLocation: "",
          });
        } else if (Number(product.stock ?? 0) + activeReserved > 0) {
          blockers.push(`${product.name ?? productId}: no active default warehouse exists for its stock.`);
          continue;
        }
        const stock = legacy.length
          ? legacy.reduce((sum, row) => sum + available(row), 0)
          : Number(product.stock ?? 0);
        catalogUpdates.push({ product, stock, colors });
      }
    }

    for (const order of allOrders) {
      const items = (order.items ?? []).map((line: any) => {
        const product = productById.get(id(line.product));
        const sku = product ? selectedSku(product, line) : null;
        return sku ? { ...line, sku } : line;
      });
      if (items.some((line: any, index: number) => line.sku !== (order.items?.[index] as any)?.sku)) {
        orderPatches.push({ _id: order._id, items });
      }
    }
    for (const cart of carts) {
      const items = (cart.items ?? []).map((line: any) => {
        const product = productById.get(id(line.product));
        const sku = product ? selectedSku(product, line) : null;
        return sku ? { ...line, sku } : line;
      });
      if (items.some((line: any, index: number) => line.sku !== (cart.items?.[index] as any)?.sku)) {
        cartPatches.push({ _id: cart._id, items });
      }
      for (const line of items) {
        if (line.product && !line.sku) blockers.push(`Cart ${id(cart._id)} contains a product variant that cannot be resolved to a SKU; the original cart will not be modified.`);
      }
    }
    for (const po of pendingPos) {
      const items = (po.items ?? []).map((line: any) => {
        const product = productById.get(id(line.product));
        return product?.type === "simple" && product.sku ? { ...line, sku: product.sku } : line;
      });
      if (items.some((line: any, index: number) => line.sku !== (po.items?.[index] as any)?.sku)) poPatches.push({ _id: po._id, items });
      for (const line of po.items ?? []) {
        const product = productById.get(id(line.product));
        if (product?.type === "variable" && !line.sku) blockers.push(`Pending purchase order ${id(po.orderNumber || po._id)} has a variable product line with no SKU; select the intended variant before migration.`);
      }
    }
    for (const transfer of pendingTransfers) {
      const items = (transfer.items ?? []).map((line: any) => {
        const product = productById.get(id(line.product));
        return product?.type === "simple" && product.sku ? { ...line, sku: product.sku } : line;
      });
      if (items.some((line: any, index: number) => line.sku !== (transfer.items?.[index] as any)?.sku)) transferPatches.push({ _id: transfer._id, items });
      for (const line of transfer.items ?? []) {
        const product = productById.get(id(line.product));
        if (product?.type === "variable" && !line.sku) blockers.push(`Pending transfer ${id(transfer.reference || transfer._id)} has a variable product line with no SKU; select the intended variant before migration.`);
      }
    }

    // Verify existing partial runs are exact before writing anything else.
    const inserts: TargetRow[] = [];
    for (const target of targets) {
      const existing = await SkuInventory.collection.findOne({
        product: target.product,
        sku: target.sku,
        warehouse: target.warehouse,
      });
      if (!existing) inserts.push(target);
      else if (
        Number(existing.quantity) !== target.quantity ||
        Number(existing.reserved) !== target.reserved ||
        String(existing.binLocation ?? "") !== target.binLocation
      ) {
        blockers.push(`Existing SKU inventory differs from migration source for ${target.sku} at warehouse ${id(target.warehouse)}; review manually.`);
      }
    }

    console.log(`Products scanned: ${products.length}`);
    console.log(`Legacy inventory rows preserved: ${legacyRows.length}`);
    console.log(`SKU inventory rows to add: ${inserts.length}`);
    console.log(`Catalog stock snapshots to update: ${catalogUpdates.length}`);
    console.log(`Order/cart documents to enrich with SKU: ${orderPatches.length + cartPatches.length}`);
    console.log(`Pending purchase orders/transfers to enrich: ${poPatches.length + transferPatches.length}`);
    if (blockers.length) {
      console.error("Migration blocked; no writes were made:");
      blockers.forEach((blocker) => console.error(`- ${blocker}`));
      if (apply) process.exitCode = 2;
      return;
    }
    if (!apply) {
      console.log("Preview only. Review the report, back up MongoDB, then rerun with --apply.");
      return;
    }

    const snapshots = mongoose.connection.collection("skuInventoryMigrationSnapshots");
    const documentSnapshots = mongoose.connection.collection("skuInventoryDocumentSnapshots");
    for (const snapshot of invalidSnapshots as any[]) {
      const original = liveProductById.get(id(snapshot.productId));
      if (original) {
        await snapshots.updateOne(
          { productId: snapshot.productId },
          { $set: { product: original } }
        );
      }
    }
    for (const { product, stock, colors } of catalogUpdates) {
      await snapshots.updateOne(
        { productId: product._id },
        { $setOnInsert: { product, capturedAt: new Date() } },
        { upsert: true }
      );
    }
    for (const target of inserts) {
      await SkuInventory.collection.updateOne(
        { product: target.product, sku: target.sku, warehouse: target.warehouse },
        { $setOnInsert: { ...target, createdAt: new Date(), updatedAt: new Date() } },
        { upsert: true }
      );
    }
    for (const { product, stock, colors } of catalogUpdates) {
      await Product.collection.updateOne(
        { _id: product._id },
        { $set: {
          stock,
          ...(product.type === "simple" ? { featureImage: product.featureImage || product.images?.[0] || "" } : {}),
          ...(product.type === "variable" ? { colors } : {}),
        } }
      );
    }
    const documentPatches = [
      { collection: "orders", patches: orderPatches },
      { collection: "carts", patches: cartPatches },
      { collection: "purchaseorders", patches: poPatches },
      { collection: "transfers", patches: transferPatches },
    ];
    for (const group of documentPatches) {
      const collection = mongoose.connection.collection(group.collection);
      for (const patch of group.patches) {
        const original = await collection.findOne({ _id: patch._id });
        if (original) await documentSnapshots.updateOne(
          { collection: group.collection, documentId: patch._id },
          { $setOnInsert: { document: original, capturedAt: new Date() } },
          { upsert: true }
        );
      }
    }
    for (const group of documentPatches) {
      const collection = mongoose.connection.collection(group.collection);
      for (const patch of group.patches) {
        await collection.updateOne({ _id: patch._id }, { $set: { items: patch.items } });
      }
    }
    await SkuInventory.createIndexes();
    console.log("Migration applied. Original Inventory rows were left untouched; snapshots are in skuInventoryMigrationSnapshots.");
  } finally {
    await mongoose.disconnect();
  }
};

if (isDirectRun("migrateSkuInventory")) {
  migrate().catch((error) => {
    console.error("SKU inventory migration failed:", error);
    process.exitCode = 1;
  });
}

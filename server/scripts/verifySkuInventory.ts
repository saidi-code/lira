import "dotenv/config";
import mongoose from "mongoose";
import { resolveDbUri } from "../config/db.js";
import Product from "../models/Products.js";
import SkuInventory from "../models/SkuInventory.js";

const verify = async () => {
  await mongoose.connect(resolveDbUri(), { autoIndex: false });
  try {
    const [products, rows] = await Promise.all([
      Product.find().select("_id name sku type stock colors").lean(),
      SkuInventory.find().select("product sku quantity reserved").lean(),
    ]);
    const problems: string[] = [];
    for (const product of products) {
      const productRows = rows.filter((row) => String(row.product) === String(product._id));
      const totalAvailable = productRows.reduce((sum, row) => sum + row.quantity - row.reserved, 0);
      if (totalAvailable !== Number(product.stock ?? 0)) {
        problems.push(`${product.name}: product stock ${product.stock} differs from SKU availability ${totalAvailable}.`);
      }
      if (product.type === "variable") {
        for (const color of product.colors ?? []) {
          for (const variant of color.variants ?? []) {
            const available = productRows
              .filter((row) => row.sku === variant.sku)
              .reduce((sum, row) => sum + row.quantity - row.reserved, 0);
            if (available !== Number(variant.stock ?? 0)) {
              problems.push(`${product.name} / ${variant.sku}: variant stock ${variant.stock} differs from SKU availability ${available}.`);
            }
          }
        }
      }
    }

    const [activeOrders, carts] = await Promise.all([
      mongoose.connection.collection("orders").find({ orderStatus: { $in: ["placed", "processing"] } }).toArray(),
      mongoose.connection.collection("carts").find({}).toArray(),
    ]);
    const productById = new Map(products.map((product) => [String(product._id), product]));
    for (const order of activeOrders) {
      for (const item of order.items ?? []) {
        if (productById.has(String(item.product)) && !item.sku) {
          problems.push(`Active order ${String(order.orderNumber ?? order._id)} has a line without a SKU.`);
        }
      }
    }
    for (const cart of carts) {
      for (const item of cart.items ?? []) {
        if (productById.has(String(item.product)) && !item.sku) {
          problems.push(`Cart ${String(cart._id)} has a line without a SKU.`);
        }
      }
    }

    console.log(`Products checked: ${products.length}`);
    console.log(`SKU inventory rows checked: ${rows.length}`);
    console.log(`Active orders and carts checked: ${activeOrders.length + carts.length}`);
    if (problems.length) {
      console.error("SKU inventory verification failed:");
      problems.forEach((problem) => console.error(`- ${problem}`));
      process.exitCode = 2;
    } else {
      console.log("SKU totals and active order/cart SKU references are consistent.");
    }
  } finally {
    await mongoose.disconnect();
  }
};

verify().catch((error) => {
  console.error("SKU inventory verification failed:", error?.message ?? error);
  process.exitCode = 1;
});

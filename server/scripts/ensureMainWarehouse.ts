import "dotenv/config";
import mongoose from "mongoose";
import Warehouse from "../models/Warehouse.js";
import { resolveDbUri } from "../config/db.js";

const ensureMainWarehouse = async () => {
  await mongoose.connect(resolveDbUri(), { autoIndex: false });
  try {
    const activeDefault = await Warehouse.findOne({ isDefault: true, isActive: true }).lean();
    if (activeDefault) {
      console.log(`Active default warehouse already exists: ${activeDefault.name} (${activeDefault.code}).`);
      return;
    }

    const reservedCode = await Warehouse.findOne({ code: "MAIN" }).lean();
    if (reservedCode) {
      throw new Error("Warehouse code MAIN already exists without being the active default; review it manually instead of changing it automatically.");
    }

    const warehouse = await Warehouse.create({
      name: "Main Warehouse",
      code: "MAIN",
      address: { country: "Tunisia" },
      isActive: true,
      isDefault: true,
    });
    console.log(`Created active default warehouse ${warehouse.name} (${warehouse.code}). No stock was changed.`);
  } finally {
    await mongoose.disconnect();
  }
};

ensureMainWarehouse().catch((error) => {
  console.error("Default warehouse setup failed:", error?.message ?? error);
  process.exitCode = 1;
});

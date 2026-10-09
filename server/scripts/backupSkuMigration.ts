import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { BSON, MongoClient } from "mongodb";
import { resolveDbUri } from "../config/db.js";

const collections = [
  "products",
  "inventory",
  "skuinventories",
  "orders",
  "carts",
  "purchaseorders",
  "transfers",
  "warehouses",
  "stockmovements",
  "skuInventoryMigrationSnapshots",
  "skuInventoryDocumentSnapshots",
];

const backup = async () => {
  const uri = resolveDbUri();
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20_000 });
  await client.connect();

  try {
    const db = client.db();
    const exported = [];
    for (const name of collections) {
      const collection = db.collection(name);
      let documents: unknown[] = [];
      let indexes: unknown[] = [];
      try {
        documents = await collection.find({}).toArray();
        indexes = await collection.listIndexes().toArray();
      } catch (error: any) {
        if (error?.code !== 26 && error?.codeName !== "NamespaceNotFound") throw error;
      }
      exported.push({ name, documents, indexes });
    }

    const folder = path.resolve(process.cwd(), "backups");
    await mkdir(folder, { recursive: true });
    const filename = `sku-migration-${new Date().toISOString().replace(/[:.]/g, "-")}.ejson.gz`;
    const output = path.join(folder, filename);
    const payload = BSON.EJSON.stringify(
      { formatVersion: 1, database: db.databaseName, createdAt: new Date(), collections: exported },
      { relaxed: false },
      2
    );
    await writeFile(output, gzipSync(payload), { flag: "wx" });
    console.log(`Backup saved: ${output}`);
    for (const entry of exported) console.log(`${entry.name}: ${entry.documents.length} documents`);
  } finally {
    await client.close();
  }
};

backup().catch((error) => {
  console.error("MongoDB backup failed; migration was not started:", error?.message ?? error);
  process.exitCode = 1;
});

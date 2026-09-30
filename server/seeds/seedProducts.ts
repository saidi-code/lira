import "dotenv/config";

import { MongoClient } from "mongodb";

// seed.js

// ==================== YOUR PRODUCTS DATA (fixed version) ====================
import { PRODUCTS } from "../data/index.js";

// ==================== SEED CONFIGURATION ====================
const MONGO_URI = process.env.DB_URI || "mongodb+srv://ecommerce_app_user:T612iNnyCpZLm8hk@cluster0.wgatjae.mongodb.net/?retryWrites=true&w=majority"; // change if needed
const DB_NAME =  process.env.DB_NAME;          // change to your DB name
const COLLECTION_NAME = 'products';

// Set to true if you want to delete all existing products before seeding
const CLEAR_COLLECTION_BEFORE_SEED = true;

async function seed() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    if (CLEAR_COLLECTION_BEFORE_SEED) {
      const deleteResult = await collection.deleteMany({});
      console.log(`🧹 Cleared ${deleteResult.deletedCount} existing products`);
    }

    const insertResult = await collection.insertMany(PRODUCTS);
    console.log(`🌱 Seeded ${insertResult.insertedCount} products`);
    console.log('✨ Done!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await client.close();
  }
}

seed();


import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("Error connecting to MongoDB:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("Disconnected from MongoDB");
  });

  let fullUri;
  const baseUri = process.env.MONGODB_URI_BASE || process.env.DB_URI;
  const dbName = process.env.DB_NAME;

  if (!baseUri || !dbName) {
    throw new Error(
      "Missing DB config. Set MONGODB_URI_BASE (or DB_URI) and DB_NAME. See .env.example"
    );
  }

  // Clean base URI (remove trailing / and ? params DB if any), append DB_NAME
  const cleanBase = baseUri.replace(/\/[^\/]*$/, "").replace(/\/+$/, "");
  fullUri = `${cleanBase}/${dbName}`;

  // Log masked
  const maskedUri = fullUri.replace(
    /^(mongodb[^\/:\/]+:\/\/)[^@]+@/,
    `$1***:***@`
  );
  console.log("MongoDB URI:", maskedUri);

  try {
    await mongoose.connect(fullUri);

    // Build/refresh indexes for all registered models.
    // This is what creates the `name_text_description_text` index
    // required by $text queries.
    await Promise.all(
      Object.values(mongoose.models).map((model) =>
        model.syncIndexes().catch((err) => {
          console.error(`Failed to sync indexes for ${model.modelName}:`, err);
        })
      )
    );
    console.log("Mongoose indexes synced");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    throw error;
  }
};

export default connectDB;
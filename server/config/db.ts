import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Build the connection string from the environment.
 *
 * Exported and pure so a maintenance script can reuse it without importing the
 * side effects of `connectDB()` — which creates indexes on every connect, and so
 * would make a "read-only" report not read-only.
 *
 * Takes `env` as a parameter rather than reading `process.env` directly so the
 * behaviour is testable without mutating the real environment.
 *
 * Note: this strips everything after the final `/`. A URI with no database path
 * therefore collapses to `mongodb+srv:/dbname` — losing host and credentials —
 * so `.env.example` always shows a path. That fails loudly at connect time rather
 * than connecting somewhere unintended, and the behaviour is pinned by a test.
 */
export const resolveDbUri = (
  env: NodeJS.ProcessEnv = process.env
): string => {
  const baseUri = env.MONGODB_URI_BASE || env.DB_URI;
  const dbName = env.DB_NAME;

  if (!baseUri || !dbName) {
    throw new Error(
      "Missing DB config. Set MONGODB_URI_BASE (or DB_URI) and DB_NAME. See .env.example"
    );
  }

  // Clean base URI (remove trailing / and ? params DB if any), append DB_NAME
  const cleanBase = baseUri.replace(/[^/]*$/, "").replace(/\/+$/, "");
  return `${cleanBase}/${dbName}`;
};

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

  const fullUri = resolveDbUri();

  // Log masked
  const maskedUri = fullUri.replace(
    /^(mongodb[^/:]+:\/\/)[^@]+@/,
    `$1***:***@`
  );
  console.log("MongoDB URI:", maskedUri);

  try {
    await mongoose.connect(fullUri);

    // Create any missing indexes; never drop an existing one.
    //
    // `syncIndexes()` was used here, which is *destructive*: it drops every index
    // the schema does not declare. A single incomplete or partially-loaded
    // schema would therefore delete production indexes on startup — and a dropped
    // unique constraint is far worse than a missing one, because duplicates can
    // then be written. The failure modes are not symmetric:
    //
    //   createIndexes() missing a schema   -> queries get slower (visible, safe)
    //   syncIndexes()  with a bad schema   -> constraints vanish (silent, not safe)
    //
    // Failing safe is worth more here than converging automatically. Stale
    // indexes are a real cost of that choice, so removing one is a deliberate
    // manual act.
    //
    // One-time cleanup for an existing deployment: the two conflicting text
    // indexes that used to sit on `Product` (see models/Colors.ts) are still on
    // the collection, because this call will not remove them. Run
    // `npm run indexes:products -- --fix`, which drops exactly those and then
    // builds the declared ones. It is not done here because a startup path that
    // drops indexes is the very thing this function was changed to stop doing.
    await Promise.all(
      Object.values(mongoose.models).map((model) =>
        model.createIndexes().catch((err) => {
          console.error(`Failed to create indexes for ${model.modelName}:`, err);
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
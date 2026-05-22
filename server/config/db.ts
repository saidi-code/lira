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
    const PORT = process.env.PORT || 27017;

    if (!baseUri || !dbName) {
        throw new Error("Missing DB config. Set MONGODB_URI_BASE (or DB_URI) and DB_NAME. See .env.example");
    }

 
    // Clean base URI (remove trailing / and ? params DB if any), append DB_NAME
    const cleanBase = baseUri.replace(/\/[^\/]*$/, '').replace(/\/+$/, '');
    fullUri = `${cleanBase}/${dbName}`;

    // Log masked
    const maskedUri = fullUri.replace(/^(mongodb[^\/:\/]+:\/\/)[^@]+@/, `$1***:***@`);
    console.log("MongoDB URI:", maskedUri);
    try {
        await mongoose.connect(fullUri);
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
    }   
}
export default connectDB;

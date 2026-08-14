import mongoose from "mongoose";
import { ICollection } from "../types/index.js";

const collectionSchema = new mongoose.Schema<ICollection>({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  cta: { type: String, required: true },
  banner: { type: String, required: true },
}, { timestamps: true });

const Collection = mongoose.model<ICollection>("Collection", collectionSchema);
export default Collection;
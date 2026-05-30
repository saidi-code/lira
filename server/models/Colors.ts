import mongoose from "mongoose"
import { variantSchema } from "./Varianats.js";
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
  images: [{ type: String }], // array of image URLs
  // Store variant subdocuments directly using variantSchema (embedded subdocuments).
  variants: [variantSchema],
},{timestamps:true});

colorSchema.index({name:"text"})

const Color = mongoose.model("Color",colorSchema)
export default Color
import mongoose from "mongoose"
import { variantSchema } from "./Varianats.js";
const colorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hex: { type: String, required: true },
  images: [{ type: String }], // array of image URLs
  // Store variant subdocuments directly using variantSchema (embedded subdocuments).
  variants: [variantSchema],
},{timestamps:true});

// No index here on purpose.
//
// This schema is *embedded* in `Product` (`colors: [Color.schema]`), and an
// index declared on an embedded schema is applied to every parent collection it
// is embedded in. Together with `variantSchema`'s text index — which `Product`
// reaches through two levels of nesting — that put two text indexes on the
// Product collection, and MongoDB permits only one per collection. `Product.init()`
// threw, `db.ts` swallowed the error, and no product index was ever built.
//
// If full-text search over colour names is ever wanted, declare the index on
// the standalone `Color` model instead.
const Color = mongoose.model("Color",colorSchema)
export default Color
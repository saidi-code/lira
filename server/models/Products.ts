import mongoose from "mongoose";


import Color from "./Colors.js";
const productSchema = new mongoose.Schema({
 name: { type: String, required: true,trim:true },
 type:{type:String,required:true,enum:["simple","variable"],default:"simple"},
 sku:{type:String,required:function(this: { type?: string }) { return this.type === "simple"; },trim:true},
 subtitle: { type: String, required: true },
 description: { type: String, required: true },
 sizes:[{type:String}],
 category:{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
    required: true
},
 subCategory: { type: String, required: true,enum:["man","woman","men","women","kids"] },
  brand: { type: String, required: true },
  price:{type:Number,required:true,min:0},
  stock: { type: Number ,min:0,default:0},
  isFeatured: { type: Boolean, default: false },
  featureImage: { type: String, default: "" },
  images:[{type:String}],
  isActive: { type: Boolean, default: true },
  /**
   * AGENT.md §11. Optional on purpose: plenty of stock arrives from a supplier
   * nobody has entered yet, and requiring it would block those products from
   * being created at all. `Supplier.products` is the advisory reverse link —
   * neither side is enforced, since suppliers routinely ship things they were
   * never listed for.
   */
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    default: null,
  },
  colors: [{ type: Color.schema, required: false }],

},{timestamps:true}) 

// Product.ts
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, price: 1 });
productSchema.index({ isActive: 1, brand: 1 });
productSchema.index({ 'colors.hex': 1 });
productSchema.index({ sizes: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.methods.generateSKU = function () {
  if(this.type === "simple"){
  const namePart = this.name.replace(/\s+/g, '').toUpperCase().slice(0, 3); 
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  this.sku = `SMP-${namePart}-${randomPart}`;

  }else{
    this.sku=null
  }
}

const Product = mongoose.model("Product",productSchema)

export default Product

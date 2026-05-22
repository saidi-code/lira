import mongoose from "mongoose";


import Color from "./Colors.js";
const productSchema = new mongoose.Schema({
 name: { type: String, required: true,trim:true },
  description: { type: String, required: true },
  subtitle: { type: String, required: true },
  brand: { type: String, required: true },
  category:{type:String,required:true,enum:["مجوهرات", "ساعات","عطور","ملابس","باخور","حقائب يد","إكسسوارات","أحذية","مكياج"]},
  subCategory: { type: String, required: true,enum:["man","woman","kids"] },
  type:{type:String,required:true,enum:["simple","variable"],default:"simple"},
  stock: { type: Number ,min:0,default:0},
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  sizes:[{type:String}],
  images:[{type:String}],
  colors: [{ type: String }],
  vcolors:[{type:Color.schema,required:false}],
  price:{type:Number,required:true,min:0}
},{timestamps:true}) 

productSchema.index({name:"text",description:"text"})

const Product = mongoose.model("Product",productSchema)

export default Product
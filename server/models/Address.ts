import mongoose from "mongoose"
const addressSchema = new mongoose.Schema({
user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,unique:true},
type:{type:String,required:true,enum:["Home","Work","Other"],default:"Other"},
street:{type:String,required:true},
city:{type:String,required:true},
state:{type:String,required:true},
zipCode:{type:String,required:true},
phoneNumber:{type:String,required:true},
isDefault:{type:Boolean,default:false},
createdAt:{type:Date,default:Date.now}
})

export default mongoose.model("Address",addressSchema)
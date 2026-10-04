import mongoose from "mongoose"
const addressSchema = new mongoose.Schema({
user:{type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
type:{type:String,required:true,enum:["Home","Work","Other"],default:"Other"},
street:{type:String,required:true,maxlength:200},
city:{type:String,required:true,maxlength:100},
state:{type:String,required:true,maxlength:100},
zipCode:{type:String,required:true,maxlength:20},
phoneNumber:{type:String,required:true,maxlength:30},
isDefault:{type:Boolean,default:false},
createdAt:{type:Date,default:Date.now}
})

export default mongoose.model("Address",addressSchema)
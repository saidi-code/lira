import mongoose from "mongoose";
import {IUser} from "../types/index.js";
const userSchema = new mongoose.Schema<IUser>({
   
    clerkId: { type: String,  unique: true,sparse: true },
    email: { type: String, required: true, unique: true ,trim: true},
    name: { type: String, required: true,trim: true },
    image:{ type: String,},
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
},{ timestamps: true });
const User = mongoose.model<IUser>('User', userSchema);
export default User;
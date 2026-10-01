import mongoose from "mongoose";
import {IUser} from "../types/index.js";

/**
 * Roles (AGENT.md §10). Exported so the schema, the client and the docs can share
 * one list.
 *
 * `manager` / `cashier` / `warehouse_staff` are what `authorize(...)` actually
 * checks, but this enum used to hold only `user` and `admin` — so assigning one
 * of those roles failed validation and every staff route was unreachable in
 * practice, however it was written.
 */
export const USER_ROLES = [
  "user",
  "admin",
  "manager",
  "cashier",
  "warehouse_staff",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new mongoose.Schema<IUser>({

    clerkId: { type: String,  unique: true,sparse: true },
    email: { type: String, required: true, unique: true ,trim: true},
    name: { type: String, required: true,trim: true },
    image:{ type: String,},
    role: { type: String, enum: USER_ROLES, default: 'user' },
},{ timestamps: true });
const User = mongoose.model<IUser>('User', userSchema);
export default User;
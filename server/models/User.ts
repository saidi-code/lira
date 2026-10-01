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
    // Optional, and uniquely indexed only when present. Clerk permits phone-only
    // accounts — the storefront's own sign-up asks for a phone number — so
    // requiring an email here meant those customers could never be created, and
    // `protect` would 401 them permanently.
    email: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true,trim: true },
    image:{ type: String,},
    role: { type: String, enum: USER_ROLES, default: 'user' },
},{ timestamps: true });
const User = mongoose.model<IUser>('User', userSchema);
export default User;
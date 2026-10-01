// `export {}` keeps this file a *module*, which `declare global` requires — an
// empty top-level import used to serve the same purpose but was flagged as unused
// by lint. Deleting it silently disables the augmentation below (every
// `req.user` in the codebase then fails to compile: ERR TS2339).
import type mongoose from "mongoose";
import type { UserRole } from "../models/User.js";

export {};

/** The local `User` document as `protect` attaches it (a `.lean()` result). */
export interface AuthenticatedUser {
  /**
   * `ObjectId`, not `unknown`: this value goes straight into Mongoose filters,
   * and a loose type here turns every one of those call sites into an overload
   * error — noise that hides the real findings.
   */
  _id: mongoose.Types.ObjectId;
  clerkId?: string | null;
  name?: string;
  email?: string;
  image?: string;
  /**
   * Typed rather than `any` on purpose: `authorize()` compares this against
   * `UserRole[]`, and with `any` a stale or missing role would sail through the
   * compiler and then fail at runtime as a 403 on every single request.
   */
  role: UserRole;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
            auth?: any;
        }
    }
}

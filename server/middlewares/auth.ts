import { Request, Response, NextFunction } from 'express';
import User, { USER_ROLES, type UserRole } from '../models/User.js';
export const protect = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {userId } = await req.auth()
    
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await User.findOne({ clerkId: userId }).lean();

        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized: user not found in database" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in auth middleware", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

/**
 * Restricts a route to the given roles.
 *
 * Typed as `UserRole[]`, not `string[]`, on purpose. The roles the app actually
 * uses once included `manager` and `warehouse_staff` while `User.role` accepted
 * only `user` and `admin` — so the routes were correct and unreachable, and
 * nothing said so. Typing the parameter means a typo (`'warehous_staff'`) is a
 * compile error instead of a route that 403s everyone who is not a ghost.
 */
export const authorize = (...roles: UserRole[]) => {
    return (req:Request, res:Response, next:NextFunction) => {
        // No user at all means the route was reached without `protect`, which is
        // a wiring bug — and must deny rather than fall through.
        const role = req.user?.role;
        if (!role || !roles.includes(role)) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        next();
    }
}

/** The role list, re-exported so routes import one thing. */
export { USER_ROLES };
export type { UserRole };
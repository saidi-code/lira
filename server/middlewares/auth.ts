import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import mongoose from "mongoose"
export const protect = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const {userId } = await req.auth()
    
        if(!userId) {
            return res.status(401).json({ "success": "false", "message": "Unauthorized" });
        }
let user = await User.findOne({ clerkId: userId });

        if (!user) {
            return res.status(401).json({ "success": "false", "message": "Unauthorized user not found in db" });
        }

        req.user = user;
        console.log("Authenticated user:", req.user);
        next();
    }catch(error){
        console.error("Error in auth middleware", error);
        res.status(500).json({ "success": "false", "message": "Server Error" });
    }
}
export const authorize = (...roles:string[]) => {
    return (req:Request, res:Response, next:NextFunction) => {
        if(!roles.includes(req.user?.role || '')) {
            return res.status(403).json({ "success": "false", "message": "Forbidden" });
        }
        next();
    }
}
import express from "express";
import { getWishList , addToWishList, removeFromWishList } from "../controllers/wishListController";
import { protect } from "../middlewares/auth.js";
const router = express.Router();

router.use(protect);
router.get("/", getWishList);
router.post("/add", addToWishList);
router.delete("/remove/:productId", removeFromWishList);

export default router;
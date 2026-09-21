import express from "express"
import {getCart,addToCart,updateCartItem,deleteCartItem,clearCart} from "../controllers/CartController.js"
import {protect} from "../middlewares/auth.js"
const router = express.Router()
// All routes require authentication
router.use(protect);

router.get("/",getCart)
router.post("/add",addToCart)
router.put("/item/:productId",updateCartItem)
router.get("/item/:productId",updateCartItem)
router.delete("/item/:productId",deleteCartItem)
router.delete("/",clearCart)

export default router

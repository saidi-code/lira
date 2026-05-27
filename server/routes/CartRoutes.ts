import express from "express"
import {getCart,addToCart,updateCartItem,deleteCartItem,clearCart} from "../controllers/CartController.js"
import {protect} from "../middlewares/auth.js"
const router = express.Router()

router.get("/",protect,getCart)
router.post("/add",protect,addToCart)
router.put("/item/:productId",protect,updateCartItem)
router.get("/item/:productId",protect,updateCartItem)
router.delete("/item/:productId",protect,deleteCartItem)
router.delete("/",protect,clearCart)

export default router

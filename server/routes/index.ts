import express from 'express';
import productsRouter from './productsRoutes.js';
import cartRouter from './CartRoutes.js';
import wishListRoutes from './wishListRoutes.js';
import collectionsRouter from './collectionsRoutes.js';
import categoriesRouter from './categoriesRoutes.js';
import addressesRoutes from "./addressesRoutes.js"
import ordersRoutes from "./OrderRoutes.js"
import reviewsRoutes from "./reviewsRoutes.js";
import adminRouter from "./adminRoutes.js";
import clerkWebhook from "../controllers/webhooks.js";
const router = express.Router();
router.post('/clerk', express.raw({ type: 'application/json' }),clerkWebhook) 
router.use('/products', productsRouter); 
router.use('/addresses',addressesRoutes)
router.use('/cart', cartRouter);
router.use('/wishlist', wishListRoutes);
router.use('/collections', collectionsRouter);
router.use('/categories', categoriesRouter);
router.use('/orders',ordersRoutes)
router.use('/reviews', reviewsRoutes)
router.use('/admin', adminRouter)
export default router;
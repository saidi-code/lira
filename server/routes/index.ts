import express from 'express';
import productsRouter from './productsRoutes.js';
import cartRouter from './CartRoutes.js';
import wishListRoutes from './wishListRoutes.js';
import collectionsRouter from './collectionsRoutes.js';
import { Request, Response } from 'express';
import clerkWebhook from "../controllers/webhooks.js";
const router = express.Router();
router.post('/clerk', express.raw({ type: 'application/json' }),clerkWebhook) 
router.use('/products', productsRouter); 
router.use('/cart', cartRouter);
router.use('/wishlist', wishListRoutes);
router.use('/collections', collectionsRouter);
export default router;
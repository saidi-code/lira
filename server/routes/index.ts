import express from 'express';
import productsRouter from './productsRoutes.js';
import cartRouter from './CartRoutes.js';
import { Request, Response } from 'express';
const router = express.Router();
router.use('/products', productsRouter); 
router.use('/cart', cartRouter);

router.post('/clerk', express.raw({ type: 'application/json' }),clerkWebhook) 

export default router;
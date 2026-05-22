import express from 'express';
import productsRouter from './productsRoutes.js';
import cartRouter from './CartRoutes.js';
const router = express.Router();
router.use('/products', productsRouter); 
router.use('/cart', cartRouter);
import { Request, Response } from 'express';



router.get('/', (req: Request, res: Response) => {
    console.log('Received request at /api/v1/');
    res.send('Server is Live!');
});
export default router;
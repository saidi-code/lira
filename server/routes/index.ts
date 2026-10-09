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
import pricingRouter from "./pricingRoutes.js";
import internalRouter from "./internalRoutes.js";
import inventoryRouter from "./inventoryRoutes.js";
import warehouseRouter from "./warehouseRoutes.js";
import supplierRouter from "./supplierRoutes.js";
import purchaseOrderRouter from "./purchaseOrderRoutes.js";
import transferRouter from "./transferRoutes.js";
import notificationRouter from "./notificationRoutes.js";
const router = express.Router();
router.use('/products', productsRouter); 
router.use('/addresses',addressesRoutes)
router.use('/cart', cartRouter);
router.use('/wishlist', wishListRoutes);
router.use('/collections', collectionsRouter);
router.use('/categories', categoriesRouter);
router.use('/orders',ordersRoutes)
router.use('/reviews', reviewsRoutes)
router.use('/admin', adminRouter)
router.use('/pricing', pricingRouter)
// Scheduler-only endpoints (shared secret, no user session).
router.use('/internal', internalRouter)
// Inventory ledger (§9) — roles per §10.
router.use('/inventory', inventoryRouter)
router.use('/warehouses', warehouseRouter)
// Purchasing (§12).
router.use('/suppliers', supplierRouter)
router.use('/purchase-orders', purchaseOrderRouter)
router.use('/transfers', transferRouter)
router.use('/notifications', notificationRouter)

export default router;

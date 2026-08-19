import express from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import {upload} from '../middlewares/upload.js';
const productsRouter = express.Router();
import { getProducts,searchProducts, getProductById, createProduct  } from '../controllers/productController.js';    
// import protect from '../middlewares/auth.js';
productsRouter.get('/search', searchProducts);
productsRouter.get('/', getProducts);
productsRouter.get('/:id', getProductById);
productsRouter.post('/', upload.array("images", 5), protect, authorize('admin'), createProduct);
// productsRouter.put('/:id', upload.array("images", 5), protect, authorize('admin'), updateProduct);
// productsRouter.delete('/:id', protect, authorize('admin'),  deleteProduct);  
// search productRoute
// GET /api/products/search?q=...&category=...&minPrice=...&maxPrice=...&page=...&limit=...
export default productsRouter;

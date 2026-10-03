import { protect, authorize } from '../middlewares/auth.js';
import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryByTitle,
  createCategory,
  updateCategory,
  deleteCategory,

} from '../controllers/CategoriesController.js';

const router = Router();

router.get('/', getCategories);
router.get('/id/:id', getCategoryById);
router.get('/title/:title', getCategoryByTitle);
// Reads are public: the storefront browses the catalogue without a session.
// Writes are admin-only. These three were registered with no middleware at all, so
// anyone on the internet could POST /categories or DELETE /categories/:id — which
// rewrites the navigation of the shop.
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;


// Method	Endpoint	Body (JSON)
// GET	/api/categories	–
// GET	/api/categories/id/123	–
// GET	/api/categories/title/ساعات	–
// POST	/api/categories	{ "title": "نظارات", "icon": "..." }
// PUT	/api/categories/123	{ "title": "نظارات شمسية" }
// DELETE	/api/categories/123	–
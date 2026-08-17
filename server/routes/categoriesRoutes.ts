import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryByTitle,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/CategoriesController.ts';

const router = Router();

router.get('/', getCategories);
router.get('/id/:id', getCategoryById);
router.get('/title/:title', getCategoryByTitle);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;


// Method	Endpoint	Body (JSON)
// GET	/api/categories	–
// GET	/api/categories/id/123	–
// GET	/api/categories/title/ساعات	–
// POST	/api/categories	{ "title": "نظارات", "icon": "..." }
// PUT	/api/categories/123	{ "title": "نظارات شمسية" }
// DELETE	/api/categories/123	–
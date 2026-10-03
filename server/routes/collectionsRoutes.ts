import { protect, authorize } from '../middlewares/auth.js';
import { Router } from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
} from '../controllers/CollectionController.js';



const router = Router();

// Reads are public (the storefront lists collections without a session); writes
// are admin-only. Every route here was registered with no middleware at all, so
// anyone could create, rename or delete a collection. The controller never reads
// `req.user`, which is exactly why these are global catalogue data rather than
// someone's saved list — and why the gate belongs on the route.
router.post('/', protect, authorize('admin'), createCollection);
router.get('/', getCollections);
router.get('/:id', getCollectionById);
router.put('/:id', protect, authorize('admin'), updateCollection);
router.delete('/:id', protect, authorize('admin'), deleteCollection);

export default router;
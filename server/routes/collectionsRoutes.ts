import { Router } from 'express';
import {
  createCollection,
  getCollections,
  getCollectionById,
  updateCollection,
  deleteCollection,
} from '../controllers/CollectionController.js';



const router = Router();

router.post('/',  createCollection);
router.get('/', getCollections);
router.get('/:id',  getCollectionById);
router.put('/:id',  updateCollection);
router.delete('/:id', deleteCollection);

export default router;
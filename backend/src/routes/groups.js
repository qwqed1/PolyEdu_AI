import express from 'express';
import { groupController } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Все роуты защищены авторизацией
router.get('/', authMiddleware, groupController.getAll);
router.get('/:id', authMiddleware, groupController.getById);
router.post('/', authMiddleware, groupController.create);
router.put('/:id', authMiddleware, groupController.update);
router.delete('/:id', authMiddleware, groupController.delete);
router.get('/:id/stats', authMiddleware, groupController.getStats);

export default router;

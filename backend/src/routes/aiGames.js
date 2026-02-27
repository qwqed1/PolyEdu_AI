import express from 'express';
import aiGameController from '../controllers/aiGameController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', authMiddleware, aiGameController.generate);
router.post('/save', authMiddleware, aiGameController.save);
router.get('/', authMiddleware, aiGameController.getAll);
router.get('/:id', authMiddleware, aiGameController.getById);
router.delete('/:id', authMiddleware, aiGameController.delete);

export default router;

import express from 'express';
import aiGameController from '../controllers/aiGameController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.post('/generate', aiGameController.generate);
router.post('/save', aiGameController.save);
router.get('/', aiGameController.getAll);
router.get('/:id', aiGameController.getById);
router.delete('/:id', aiGameController.delete);

export default router;

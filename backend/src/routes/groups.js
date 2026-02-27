import express from 'express';
import { groupController } from '../controllers/groupController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Все роуты защищены авторизацией и доступны только преподавателям
router.use(authMiddleware, requireRole('teacher'));

router.get('/', groupController.getAll);
router.get('/:id', groupController.getById);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.delete);
router.get('/:id/stats', groupController.getStats);

export default router;

import express from 'express';
import { gradeController } from '../controllers/gradeController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, gradeController.getAll);
router.post('/', authMiddleware, gradeController.create);
router.delete('/:id', authMiddleware, gradeController.delete);

export default router;

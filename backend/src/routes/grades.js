import express from 'express';
import { gradeController } from '../controllers/gradeController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/', gradeController.getAll);
router.post('/', gradeController.create);
router.delete('/:id', gradeController.delete);

export default router;

import express from 'express';
import { subjectController } from '../controllers/subjectController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/', subjectController.getAll);
router.post('/', subjectController.create);
router.delete('/:id', subjectController.delete);

export default router;

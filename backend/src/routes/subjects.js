import express from 'express';
import { subjectController } from '../controllers/subjectController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, subjectController.getAll);
router.post('/', authMiddleware, subjectController.create);
router.delete('/:id', authMiddleware, subjectController.delete);

export default router;

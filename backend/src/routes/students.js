import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, studentController.getAll);
router.post('/', authMiddleware, studentController.create);
router.delete('/:id', authMiddleware, studentController.delete);

export default router;

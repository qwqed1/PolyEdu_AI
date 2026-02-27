import express from 'express';
import { studentController } from '../controllers/studentController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/', studentController.getAll);
router.post('/', studentController.create);
router.post('/bulk', studentController.bulkCreate);
router.delete('/:id', studentController.delete);

export default router;

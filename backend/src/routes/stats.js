import express from 'express';
import { statsController } from '../controllers/statsController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/teacher', statsController.getTeacherStats);
router.get('/detailed', statsController.getDetailedStats);

export default router;

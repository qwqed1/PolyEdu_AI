import express from 'express';
import { statsController } from '../controllers/statsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/teacher', authMiddleware, statsController.getTeacherStats);
router.get('/detailed', authMiddleware, statsController.getDetailedStats);

export default router;

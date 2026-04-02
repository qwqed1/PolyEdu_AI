import express from 'express';
import aiController from '../controllers/aiController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', authMiddleware, requireRole('teacher'), aiController.sendMessage);
router.get('/health', authMiddleware, requireRole('teacher'), aiController.healthCheck);

export default router;

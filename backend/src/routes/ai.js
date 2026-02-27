import express from 'express';
import aiController from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Отправка сообщения в AI чат (требуется авторизация)
router.post('/chat', authMiddleware, aiController.sendMessage);

// Проверка здоровья AI сервиса (требуется авторизация)
router.get('/health', authMiddleware, aiController.healthCheck);

export default router;

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  activateQuiz,
  deactivateQuiz,
  getQuizByCode,
  generateQuestions,
  getQuizStats
} from '../controllers/quizController.js';
import {
  saveGameResult,
  getQuizResults,
  getLeaderboard,
  clearQuizResults
} from '../controllers/gameResultController.js';

const router = express.Router();

// Публичные маршруты (для студентов)
router.get('/join/:code', getQuizByCode);
router.post('/play/:code/result', saveGameResult);
router.get('/play/:code/leaderboard', getLeaderboard);

// Защищённые маршруты (для преподавателей)
router.get('/', authMiddleware, getQuizzes);
router.get('/stats', authMiddleware, getQuizStats);
router.get('/:id', authMiddleware, getQuizById);
router.get('/:id/results', authMiddleware, getQuizResults);
router.delete('/:id/results', authMiddleware, clearQuizResults);
router.post('/', authMiddleware, createQuiz);
router.put('/:id', authMiddleware, updateQuiz);
router.delete('/:id', authMiddleware, deleteQuiz);

// Управление игрой
router.post('/:id/activate', authMiddleware, activateQuiz);
router.post('/:id/deactivate', authMiddleware, deactivateQuiz);

// ИИ-генерация
router.post('/generate', authMiddleware, generateQuestions);

export default router;


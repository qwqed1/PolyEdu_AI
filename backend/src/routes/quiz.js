import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
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
router.use(authMiddleware, requireRole('teacher'));

router.get('/', getQuizzes);
router.get('/stats', getQuizStats);
router.get('/:id', getQuizById);
router.get('/:id/results', getQuizResults);
router.delete('/:id/results', clearQuizResults);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.delete('/:id', deleteQuiz);

// Управление игрой
router.post('/:id/activate', activateQuiz);
router.post('/:id/deactivate', deactivateQuiz);

// ИИ-генерация
router.post('/generate', generateQuestions);

export default router;


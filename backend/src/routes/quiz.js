import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  publishQuiz,
  deleteQuiz,
  generateQuestions,
  getQuizStats,
} from '../controllers/quizController.js';
import {
  getQuizResults,
  clearQuizResults,
} from '../controllers/gameResultController.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/', getQuizzes);
router.get('/stats', getQuizStats);
router.get('/:id', getQuizById);
router.get('/:id/results', getQuizResults);
router.delete('/:id/results', clearQuizResults);
router.post('/', createQuiz);
router.put('/:id', updateQuiz);
router.patch('/:id/publish', publishQuiz);
router.delete('/:id', deleteQuiz);
router.post('/generate', generateQuestions);

export default router;

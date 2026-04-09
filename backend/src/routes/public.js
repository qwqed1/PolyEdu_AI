import express from 'express';
import { publicLibraryController } from '../controllers/publicLibraryController.js';

const router = express.Router();

router.get('/library', publicLibraryController.getLibrary);
router.get('/lesson-plans/:id', publicLibraryController.getPublicLessonPlan);
router.get('/lesson-plans/:id/export-docx', publicLibraryController.exportPublicLessonPlanDocx);
router.get('/quizzes/:id', publicLibraryController.getPublicQuiz);
router.post('/quizzes/:id/results', publicLibraryController.submitPublicQuizResult);
router.get('/games/:id', publicLibraryController.getPublicGame);
router.get('/games/:id/html', publicLibraryController.getPublicGameHtml);

export default router;

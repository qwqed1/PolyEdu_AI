import express from 'express';
import { lessonPlansController } from '../controllers/lessonPlansController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Инициализация таблицы (публичный маршрут для первого запуска)
router.post('/init', lessonPlansController.initTable);

// Защищённые маршруты
router.use(authMiddleware);

// CRUD операции
router.get('/', lessonPlansController.getAll);
router.get('/subject/:subjectName', lessonPlansController.getBySubject);
router.get('/:id', lessonPlansController.getById);
router.post('/', lessonPlansController.create);
router.post('/bulk', lessonPlansController.createMany);
router.put('/:id', lessonPlansController.update);
router.delete('/subject/:subjectName', lessonPlansController.deleteBySubject);
router.delete('/:id', lessonPlansController.delete);

export default router;

import express from 'express';
import { moduleController } from '../controllers/moduleController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

// Модули группы
router.get('/groups/:groupId/modules', moduleController.getAllByGroup);
router.post('/groups/:groupId/modules', moduleController.create);

// Операции с модулем
router.put('/modules/:id', moduleController.update);
router.delete('/modules/:id', moduleController.delete);

// Предметы модуля
router.post('/modules/:moduleId/subjects', moduleController.addSubject);
router.delete('/module-subjects/:id', moduleController.deleteSubject);

export default router;

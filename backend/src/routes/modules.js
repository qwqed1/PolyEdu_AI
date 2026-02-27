import express from 'express';
import { moduleController } from '../controllers/moduleController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Модули группы
router.get('/groups/:groupId/modules', authMiddleware, moduleController.getAllByGroup);
router.post('/groups/:groupId/modules', authMiddleware, moduleController.create);

// Операции с модулем
router.put('/modules/:id', authMiddleware, moduleController.update);
router.delete('/modules/:id', authMiddleware, moduleController.delete);

// Предметы модуля
router.post('/modules/:moduleId/subjects', authMiddleware, moduleController.addSubject);
router.delete('/module-subjects/:id', authMiddleware, moduleController.deleteSubject);

export default router;

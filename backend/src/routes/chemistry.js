import express from 'express';
import chemistryController from '../controllers/chemistryController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware, requireRole('teacher'));

router.get('/compound', chemistryController.getCompound);
router.get('/compound/:id/model', chemistryController.getCompoundModel);
router.get('/reaction', chemistryController.getReaction);

export default router;

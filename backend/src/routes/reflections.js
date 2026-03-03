import express from 'express';
import { submitReflection, getStudentReflections } from '../controllers/reflectionController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('student'));

router.post('/', submitReflection);
router.get('/', getStudentReflections);

export default router;

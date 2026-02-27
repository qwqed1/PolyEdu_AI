import express from 'express';
import { aiDataPublicController } from '../controllers/aiDataPublicController.js';

const router = express.Router();

// Публичный endpoint для n8n (без JWT)
router.post('/public/query', aiDataPublicController.query.bind(aiDataPublicController));

export default router;

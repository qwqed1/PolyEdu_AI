import express from 'express';
import multer from 'multer';
import { scheduleUploadController } from '../controllers/scheduleUploadController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file upload (in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')) {
      cb(null, true);
    } else {
      cb(new Error('Только .docx файлы разрешены'), false);
    }
  }
});

// Upload docx schedule file (teachers only)
router.post('/', authMiddleware, upload.single('file'), scheduleUploadController.upload);

// Get all uploads for current user
router.get('/', authMiddleware, scheduleUploadController.getUploads);

// Get all unique groups (public - any authenticated user)
router.get('/groups', authMiddleware, scheduleUploadController.getGroups);

// Get schedule by group name
router.get('/by-group/:groupName', authMiddleware, scheduleUploadController.getByGroup);

// Delete upload
router.delete('/:id', authMiddleware, scheduleUploadController.deleteUpload);

export default router;

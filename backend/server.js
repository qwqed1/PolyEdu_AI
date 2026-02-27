import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/auth.js';
import aiRoutes from './src/routes/ai.js';
import aiDataRoutes from './src/routes/aiData.js';
import groupRoutes from './src/routes/groups.js';
import studentRoutes from './src/routes/students.js';
import gradeRoutes from './src/routes/grades.js';
import statsRoutes from './src/routes/stats.js';
import subjectRoutes from './src/routes/subjects.js';
import lessonPlansRoutes from './src/routes/lessonPlans.js';
import quizRoutes from './src/routes/quiz.js';
import moduleRoutes from './src/routes/modules.js';
import aiGameRoutes from './src/routes/aiGames.js';
import scheduleUploadRoutes from './src/routes/scheduleUpload.js';
import pool from './src/config/db.js';
import { QuizModel } from './src/models/Quiz.js';
import { GameResultModel } from './src/models/GameResult.js';
import { ModuleModel } from './src/models/modules.js';
import { AIGameModel } from './src/models/aiGames.js';
import { UserModel } from './src/models/User.js';
import { ScheduleUploadModel } from './src/models/ScheduleUpload.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-data', aiDataRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/lesson-plans', lessonPlansRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api', moduleRoutes);
app.use('/api/ai-games', aiGameRoutes);
app.use('/api/schedule-upload', scheduleUploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AIZERT Backend is running' });
});

// Initialize database tables and test connection (Только для локального запуска)
const initDatabase = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connected');

    await UserModel.ensureRoleColumn();
    console.log('✓ Users role column ensured');
    
    await QuizModel.initTable();
    console.log('✓ Quizzes table initialized');
    
    await GameResultModel.initTable();
    console.log('✓ Game results table initialized');
    
    await ModuleModel.initTable();
    console.log('✓ Modules table initialized');
    
    await AIGameModel.initTable();
    console.log('✓ AI Games table initialized');
    
    await ScheduleUploadModel.initTable();
    console.log('✓ Schedule uploads table initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
};

// Если запускаем локально, поднимаем сервер. Vercel использует экспортированный app.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    initDatabase();
  });
}

export default app;

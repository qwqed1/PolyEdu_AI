import pool from '../config/db.js';
import { LessonPlanModel } from '../models/lessonPlans.js';
import { QuizModel } from '../models/Quiz.js';
import { AIGameModel } from '../models/aiGames.js';
import { GameResultModel } from '../models/GameResult.js';
import { lessonPlanDocxService } from '../services/lessonPlanDocxService.js';

function sendDocx(res, file) {
  const fallbackName = 'lesson-plan.docx';
  const safeName = file.filename || fallbackName;

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
  );

  res.send(file.buffer);
}

function sanitizePublicQuiz(quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    type: quiz.type,
    subject_name: quiz.subject_name,
    source_lesson_plan_id: quiz.source_lesson_plan_id,
    source_lesson_topic: quiz.source_lesson_topic,
    published_at: quiz.published_at,
    created_at: quiz.created_at,
    settings: quiz.settings || {},
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map((question, questionIndex) => ({
          id: question.id || `q_${questionIndex}`,
          question: question.question,
          explanation: question.explanation || '',
          answers: Array.isArray(question.answers)
            ? question.answers.map((answer, answerIndex) => ({
                index: answerIndex,
                text: answer.text,
              }))
            : [],
        }))
      : [],
  };
}

function mapQuestionResults(quizQuestions, submittedAnswers) {
  const answersByQuestionId = new Map(
    submittedAnswers.map((item) => [String(item.questionId), Number(item.answerIndex)])
  );

  let correctAnswers = 0;
  const normalizedAnswers = [];

  quizQuestions.forEach((question, index) => {
    const questionId = String(question.id || `q_${index}`);
    const selectedAnswerIndex = answersByQuestionId.get(questionId);
    const correctAnswerIndex = Array.isArray(question.answers)
      ? question.answers.findIndex((answer) => answer.isCorrect)
      : -1;
    const isCorrect = selectedAnswerIndex === correctAnswerIndex && correctAnswerIndex >= 0;

    if (isCorrect) {
      correctAnswers += 1;
    }

    normalizedAnswers.push({
      questionId,
      selectedAnswerIndex: Number.isFinite(selectedAnswerIndex) ? selectedAnswerIndex : null,
      correctAnswerIndex,
      isCorrect,
    });
  });

  return {
    correctAnswers,
    normalizedAnswers,
  };
}

async function fetchPublishedLessonPlans({ subjectFilter, searchFilter }) {
  const params = [subjectFilter, searchFilter];
  const result = await pool.query(
    `SELECT
       id,
       subject_name,
       topic,
       lesson_type,
       group_name,
       lesson_number,
       published_at,
       created_at
     FROM lesson_plans
     WHERE is_public = true
       AND ($1::text IS NULL OR subject_name ILIKE $1)
       AND (
         $2::text IS NULL
         OR topic ILIKE $2
         OR subject_name ILIKE $2
         OR group_name ILIKE $2
       )
     ORDER BY published_at DESC NULLS LAST, created_at DESC`,
    params
  );

  return result.rows.map((item) => ({
    id: item.id,
    type: 'lesson-plan',
    title: item.topic || `План урока ${item.lesson_number || ''}`.trim(),
    description: item.lesson_type || '',
    subject_name: item.subject_name,
    group_name: item.group_name,
    lesson_number: item.lesson_number,
    published_at: item.published_at,
    created_at: item.created_at,
  }));
}

async function fetchPublishedQuizzes({ subjectFilter, searchFilter }) {
  const params = [subjectFilter, searchFilter];
  const result = await pool.query(
    `SELECT
       q.id,
       q.title,
       q.description,
       q.type,
       q.published_at,
       q.created_at,
       s.name AS subject_name,
       jsonb_array_length(q.questions) AS questions_count
     FROM quizzes q
     LEFT JOIN subjects s ON q.subject_id = s.id
     WHERE q.is_public = true
       AND ($1::text IS NULL OR s.name ILIKE $1)
       AND (
         $2::text IS NULL
         OR q.title ILIKE $2
         OR COALESCE(q.description, '') ILIKE $2
         OR COALESCE(s.name, '') ILIKE $2
       )
     ORDER BY q.published_at DESC NULLS LAST, q.created_at DESC`,
    params
  );

  return result.rows.map((item) => ({
    id: item.id,
    type: 'quiz',
    title: item.title,
    description: item.description || '',
    subject_name: item.subject_name,
    quiz_type: item.type,
    questions_count: Number(item.questions_count || 0),
    published_at: item.published_at,
    created_at: item.created_at,
  }));
}

async function fetchPublishedGames({ subjectFilter, searchFilter }) {
  const params = [subjectFilter, searchFilter];
  const result = await pool.query(
    `SELECT
       g.id,
       g.title,
       g.prompt,
       g.published_at,
       g.created_at,
       lp.subject_name
     FROM ai_games g
     LEFT JOIN lesson_plans lp ON g.source_lesson_plan_id = lp.id
     WHERE g.is_public = true
       AND ($1::text IS NULL OR COALESCE(lp.subject_name, '') ILIKE $1)
       AND (
         $2::text IS NULL
         OR g.title ILIKE $2
         OR g.prompt ILIKE $2
         OR COALESCE(lp.subject_name, '') ILIKE $2
       )
     ORDER BY g.published_at DESC NULLS LAST, g.created_at DESC`,
    params
  );

  return result.rows.map((item) => ({
    id: item.id,
    type: 'game',
    title: item.title,
    description: item.prompt || '',
    subject_name: item.subject_name,
    published_at: item.published_at,
    created_at: item.created_at,
  }));
}

export const publicLibraryController = {
  async getLibrary(req, res) {
    try {
      const type = req.query.type || 'all';
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));
      const subjectFilter = req.query.subject ? `%${req.query.subject.trim()}%` : null;
      const searchFilter = req.query.q ? `%${req.query.q.trim()}%` : null;

      const [lessonPlans, quizzes, games] = await Promise.all([
        type === 'all' || type === 'lesson-plan'
          ? fetchPublishedLessonPlans({ subjectFilter, searchFilter })
          : Promise.resolve([]),
        type === 'all' || type === 'quiz'
          ? fetchPublishedQuizzes({ subjectFilter, searchFilter })
          : Promise.resolve([]),
        type === 'all' || type === 'game'
          ? fetchPublishedGames({ subjectFilter, searchFilter })
          : Promise.resolve([]),
      ]);

      const items = [...lessonPlans, ...quizzes, ...games].sort((a, b) => {
        return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
      });

      const total = items.length;
      const start = (page - 1) * limit;
      const paginated = items.slice(start, start + limit);

      res.json({
        success: true,
        data: paginated,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      });
    } catch (error) {
      console.error('Public library error:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения публичной библиотеки' });
    }
  },

  async getPublicLessonPlan(req, res) {
    try {
      const plan = await LessonPlanModel.getPublicById(req.params.id);
      if (!plan) {
        return res.status(404).json({ success: false, error: 'Публичный план не найден' });
      }

      const related = await LessonPlanModel.getPublicRelatedMaterials(plan.id);

      res.json({
        success: true,
        data: {
          ...plan,
          related,
        },
      });
    } catch (error) {
      console.error('Public lesson plan error:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения публичного плана' });
    }
  },

  async exportPublicLessonPlanDocx(req, res) {
    try {
      const plan = await LessonPlanModel.getPublicById(req.params.id);
      if (!plan) {
        return res.status(404).json({ success: false, error: 'Публичный план не найден' });
      }

      const file = await lessonPlanDocxService.generateForPlan(plan);
      sendDocx(res, file);
    } catch (error) {
      console.error('Public lesson plan export error:', error);
      res.status(500).json({ success: false, error: 'Ошибка выгрузки публичного DOCX' });
    }
  },

  async getPublicQuiz(req, res) {
    try {
      const quiz = await QuizModel.getPublicById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Публичный квиз не найден' });
      }

      res.json({
        success: true,
        data: sanitizePublicQuiz(quiz),
      });
    } catch (error) {
      console.error('Public quiz error:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения публичного квиза' });
    }
  },

  async submitPublicQuizResult(req, res) {
    try {
      const quiz = await QuizModel.getPublicById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ success: false, error: 'Публичный квиз не найден' });
      }

      const playerName = String(req.body?.player_name || '').trim();
      const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
      const timeSpent = Math.max(0, Number(req.body?.time_spent) || 0);

      if (!playerName) {
        return res.status(400).json({ success: false, error: 'Имя игрока обязательно' });
      }

      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return res.status(400).json({ success: false, error: 'В квизе нет вопросов' });
      }

      const { correctAnswers, normalizedAnswers } = mapQuestionResults(quiz.questions, answers);
      const totalQuestions = quiz.questions.length;
      const pointsPerQuestion = Number(quiz.settings?.pointsPerQuestion || 100);
      const score = correctAnswers * pointsPerQuestion;

      const result = await GameResultModel.create({
        quiz_id: quiz.id,
        player_name: playerName,
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        answers: normalizedAnswers,
        time_spent: timeSpent,
      });

      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          score,
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
          accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
          completed_at: result.completed_at,
        },
      });
    } catch (error) {
      console.error('Public quiz submit error:', error);
      res.status(500).json({ success: false, error: 'Ошибка сохранения результата квиза' });
    }
  },

  async getPublicGame(req, res) {
    try {
      const game = await AIGameModel.getPublicById(req.params.id);
      if (!game) {
        return res.status(404).json({ success: false, error: 'Публичная игра не найдена' });
      }

      res.json({
        success: true,
        data: {
          id: game.id,
          title: game.title,
          prompt: game.prompt,
          published_at: game.published_at,
          created_at: game.created_at,
          source_lesson_plan_id: game.source_lesson_plan_id,
          source_lesson_topic: game.source_lesson_topic,
        },
      });
    } catch (error) {
      console.error('Public game error:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения публичной игры' });
    }
  },

  async getPublicGameHtml(req, res) {
    try {
      const game = await AIGameModel.getPublicById(req.params.id);
      if (!game) {
        return res.status(404).json({ success: false, error: 'Публичная игра не найдена' });
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(game.html_code);
    } catch (error) {
      console.error('Public game html error:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения HTML игры' });
    }
  },
};

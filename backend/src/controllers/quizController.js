import { QuizModel } from '../models/Quiz.js';
import aiService from '../services/aiService.js';

export const getQuizzes = async (req, res) => {
  try {
    const quizzes = await QuizModel.getAllByUserId(req.user.id);
    res.json({ success: true, data: quizzes });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении списка квизов' });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await QuizModel.getById(req.params.id, req.user.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Квиз не найден' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении квиза' });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const quizData = req.body;

    if (!quizData.title) {
      return res.status(400).json({ success: false, error: 'Название квиза обязательно' });
    }

    const quiz = await QuizModel.create(quizData, req.user.id);
    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Квиз успешно создан',
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ success: false, error: 'Ошибка при создании квиза' });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const quiz = await QuizModel.update(req.params.id, req.body, req.user.id);

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Квиз не найден' });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Квиз успешно обновлён',
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ success: false, error: 'Ошибка при обновлении квиза' });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const quiz = await QuizModel.publish(req.params.id, req.user.id, Boolean(req.body?.is_public));

    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Квиз не найден' });
    }

    res.json({ success: true, data: quiz });
  } catch (error) {
    console.error('Error publishing quiz:', error);
    res.status(500).json({ success: false, error: 'Ошибка при изменении публикации квиза' });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const deleted = await QuizModel.delete(req.params.id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Квиз не найден' });
    }

    res.json({ success: true, message: 'Квиз успешно удалён' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ success: false, error: 'Ошибка при удалении квиза' });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      topic,
      questionsCount = 5,
      difficulty = 'medium',
      type = 'multiple_choice',
    } = req.body;

    if (!topic) {
      return res
        .status(400)
        .json({ success: false, error: 'Тема обязательна для генерации вопросов' });
    }

    const prompt = `Сгенерируй ${questionsCount} вопросов для интерактивного теста на тему "${topic}".

Требования:
- Уровень сложности: ${difficulty === 'easy' ? 'лёгкий' : difficulty === 'medium' ? 'средний' : 'сложный'}
- Тип вопросов: ${type === 'multiple_choice' ? 'с вариантами ответа (4 варианта, 1 правильный)' : 'true/false'}
- Формат ответа: JSON массив

Каждый вопрос должен иметь структуру:
{
  "question": "Текст вопроса",
  "answers": [
    {"text": "Ответ 1", "isCorrect": true},
    {"text": "Ответ 2", "isCorrect": false},
    {"text": "Ответ 3", "isCorrect": false},
    {"text": "Ответ 4", "isCorrect": false}
  ],
  "explanation": "Краткое объяснение правильного ответа"
}

Верни ТОЛЬКО JSON массив вопросов, без дополнительного текста.`;

    const aiResponse = await aiService.sendMessage(prompt, userId, 'quiz_generation');

    let questions = [];
    try {
      const responseText = aiResponse.data?.response || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при обработке ответа ИИ. Попробуйте ещё раз.',
      });
    }

    questions = questions.map((question, index) => ({
      ...question,
      id: `q_${Date.now()}_${index}`,
    }));

    res.json({
      success: true,
      data: {
        questions,
        topic,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ success: false, error: 'Ошибка при генерации вопросов' });
  }
};

export const getQuizStats = async (req, res) => {
  try {
    const stats = await QuizModel.getStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    res.status(500).json({ success: false, error: 'Ошибка при получении статистики' });
  }
};

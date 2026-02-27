import { QuizModel } from '../models/Quiz.js';
import aiService from '../services/aiService.js';

/**
 * Получить все квизы текущего пользователя
 */
export const getQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizzes = await QuizModel.getAllByUserId(userId);
    res.json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении списка квизов'
    });
  }
};

/**
 * Получить квиз по ID
 */
export const getQuizById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const quiz = await QuizModel.getById(id, userId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    res.json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении квиза'
    });
  }
};

/**
 * Создать новый квиз
 */
export const createQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizData = req.body;

    if (!quizData.title) {
      return res.status(400).json({
        success: false,
        error: 'Название квиза обязательно'
      });
    }

    const quiz = await QuizModel.create(quizData, userId);
    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Квиз успешно создан'
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при создании квиза'
    });
  }
};

/**
 * Обновить квиз
 */
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const quizData = req.body;

    const quiz = await QuizModel.update(id, quizData, userId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Квиз успешно обновлён'
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при обновлении квиза'
    });
  }
};

/**
 * Удалить квиз
 */
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await QuizModel.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    res.json({
      success: true,
      message: 'Квиз успешно удалён'
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при удалении квиза'
    });
  }
};

/**
 * Активировать квиз (начать игру)
 */
export const activateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await QuizModel.activate(id, userId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: `Игра активирована! Код: ${quiz.game_code}`
    });
  } catch (error) {
    console.error('Error activating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при активации квиза'
    });
  }
};

/**
 * Деактивировать квиз (завершить игру)
 */
export const deactivateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await QuizModel.deactivate(id, userId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'Игра завершена'
    });
  } catch (error) {
    console.error('Error deactivating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при деактивации квиза'
    });
  }
};

/**
 * Найти квиз по игровому коду (для студентов)
 */
export const getQuizByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const quiz = await QuizModel.getByGameCode(code.toUpperCase());

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена или неактивна'
      });
    }

    // Возвращаем данные для игры (с вопросами, но без пометок правильных ответов в preview)
    const gameData = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      type: quiz.type,
      questionsCount: quiz.questions?.length || 0,
      settings: {
        timePerQuestion: quiz.settings?.timePerQuestion || 30,
        shuffleQuestions: quiz.settings?.shuffleQuestions || false,
        shuffleAnswers: quiz.settings?.shuffleAnswers || false,
        pointsPerQuestion: quiz.settings?.pointsPerQuestion || 100
      }
    };

    // Возвращаем также полные вопросы для игры
    const questions = (quiz.questions || []).map(q => ({
      question: q.question,
      answers: (q.answers || []).map(a => ({
        text: a.text,
        isCorrect: a.isCorrect
      })),
      explanation: q.explanation
    }));

    // Если нужно перемешать вопросы
    if (quiz.settings?.shuffleQuestions) {
      questions.sort(() => Math.random() - 0.5);
    }

    // Если нужно перемешать ответы
    if (quiz.settings?.shuffleAnswers) {
      questions.forEach(q => {
        q.answers.sort(() => Math.random() - 0.5);
      });
    }

    res.json({
      success: true,
      data: gameData,
      questions: questions
    });
  } catch (error) {
    console.error('Error finding quiz by code:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при поиске игры'
    });
  }
};

/**
 * Генерация вопросов с помощью ИИ
 */
export const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, questionsCount = 5, difficulty = 'medium', type = 'multiple_choice' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Тема обязательна для генерации вопросов'
      });
    }

    const prompt = `Сгенерируй ${questionsCount} вопросов для интерактивного теста на тему "${topic}".
    
Требования:
- Уровень сложности: ${difficulty === 'easy' ? 'лёгкий' : difficulty === 'medium' ? 'средний' : 'сложный'}
- Тип вопросов: ${type === 'multiple_choice' ? 'с вариантами ответов (4 варианта, 1 правильный)' : 'true/false'}
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
      // Попытка распарсить ответ ИИ как JSON
      const responseText = aiResponse.data?.response || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Ошибка при обработке ответа ИИ. Попробуйте ещё раз.'
      });
    }

    // Добавляем ID к каждому вопросу
    questions = questions.map((q, index) => ({
      ...q,
      id: `q_${Date.now()}_${index}`
    }));

    res.json({
      success: true,
      data: {
        questions,
        topic,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при генерации вопросов'
    });
  }
};

/**
 * Получить статистику квизов
 */
export const getQuizStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await QuizModel.getStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении статистики'
    });
  }
};

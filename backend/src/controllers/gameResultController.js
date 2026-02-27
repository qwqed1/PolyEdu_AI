import { GameResultModel } from '../models/GameResult.js';
import { QuizModel } from '../models/Quiz.js';

/**
 * Сохранить результат игры
 */
export const saveGameResult = async (req, res) => {
  try {
    const { code } = req.params;
    const { player_name, score, correct_answers, total_questions, answers, time_spent } = req.body;

    // Найти квиз по коду
    const quiz = await QuizModel.getByGameCode(code.toUpperCase());
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }

    const result = await GameResultModel.create({
      quiz_id: quiz.id,
      player_name,
      score,
      correct_answers,
      total_questions,
      answers,
      time_spent
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при сохранении результата'
    });
  }
};

/**
 * Получить результаты квиза (для преподавателя)
 */
export const getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Проверяем, что квиз принадлежит пользователю
    const quiz = await QuizModel.getById(id, userId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    const results = await GameResultModel.getByQuizId(id);
    const stats = await GameResultModel.getQuizStats(id);

    res.json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          questionsCount: quiz.questions?.length || 0
        },
        stats: {
          totalPlayers: parseInt(stats.total_players) || 0,
          avgScore: Math.round(parseFloat(stats.avg_score)) || 0,
          maxScore: parseInt(stats.max_score) || 0,
          avgAccuracy: Math.round(parseFloat(stats.avg_accuracy)) || 0,
          avgTime: Math.round(parseFloat(stats.avg_time)) || 0
        },
        results: results
      }
    });
  } catch (error) {
    console.error('Error getting quiz results:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении результатов'
    });
  }
};

/**
 * Получить лидерборд (публичный)
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { code } = req.params;

    const quiz = await QuizModel.getByGameCode(code.toUpperCase());
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Игра не найдена'
      });
    }

    const leaderboard = await GameResultModel.getLeaderboard(quiz.id, 20);

    res.json({
      success: true,
      data: {
        quizTitle: quiz.title,
        leaderboard: leaderboard.map((player, index) => ({
          rank: index + 1,
          name: player.player_name,
          score: player.score,
          accuracy: Math.round((player.correct_answers / player.total_questions) * 100),
          time: player.time_spent
        }))
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении лидерборда'
    });
  }
};

/**
 * Очистить результаты квиза
 */
export const clearQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Проверяем, что квиз принадлежит пользователю
    const quiz = await QuizModel.getById(id, userId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Квиз не найден'
      });
    }

    await GameResultModel.deleteByQuizId(id);

    res.json({
      success: true,
      message: 'Результаты очищены'
    });
  } catch (error) {
    console.error('Error clearing results:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка при очистке результатов'
    });
  }
};

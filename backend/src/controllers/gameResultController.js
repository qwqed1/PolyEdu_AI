import { GameResultModel } from '../models/GameResult.js';
import { QuizModel } from '../models/Quiz.js';

export const getQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await QuizModel.getById(id, userId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'РљРІРёР· РЅРµ РЅР°Р№РґРµРЅ',
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
          questionsCount: quiz.questions?.length || 0,
        },
        stats: {
          totalPlayers: parseInt(stats.total_players) || 0,
          avgScore: Math.round(parseFloat(stats.avg_score)) || 0,
          maxScore: parseInt(stats.max_score) || 0,
          avgAccuracy: Math.round(parseFloat(stats.avg_accuracy)) || 0,
          avgTime: Math.round(parseFloat(stats.avg_time)) || 0,
        },
        results,
      },
    });
  } catch (error) {
    console.error('Error getting quiz results:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ',
    });
  }
};

export const clearQuizResults = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const quiz = await QuizModel.getById(id, userId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'РљРІРёР· РЅРµ РЅР°Р№РґРµРЅ',
      });
    }

    await GameResultModel.deleteByQuizId(id);

    res.json({
      success: true,
      message: 'Р РµР·СѓР»СЊС‚Р°С‚С‹ РѕС‡РёС‰РµРЅС‹',
    });
  } catch (error) {
    console.error('Error clearing results:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РѕС‡РёСЃС‚РєРµ СЂРµР·СѓР»СЊС‚Р°С‚РѕРІ',
    });
  }
};

import { QuizModel } from '../models/Quiz.js';
import aiService from '../services/aiService.js';

export const getQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizzes = await QuizModel.getAllByUserId(userId);
    res.json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error getting quizzes:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° РєРІРёР·РѕРІ',
    });
  }
};

export const getQuizById = async (req, res) => {
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

    res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error getting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё РєРІРёР·Р°',
    });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const userId = req.user.id;
    const quizData = req.body;

    if (!quizData.title) {
      return res.status(400).json({
        success: false,
        error: 'РќР°Р·РІР°РЅРёРµ РєРІРёР·Р° РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ',
      });
    }

    const quiz = await QuizModel.create(quizData, userId);
    res.status(201).json({
      success: true,
      data: quiz,
      message: 'РљРІРёР· СѓСЃРїРµС€РЅРѕ СЃРѕР·РґР°РЅ',
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё СЃРѕР·РґР°РЅРёРё РєРІРёР·Р°',
    });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const quizData = req.body;

    const quiz = await QuizModel.update(id, quizData, userId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'РљРІРёР· РЅРµ РЅР°Р№РґРµРЅ',
      });
    }

    res.json({
      success: true,
      data: quiz,
      message: 'РљРІРёР· СѓСЃРїРµС€РЅРѕ РѕР±РЅРѕРІР»С‘РЅ',
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РѕР±РЅРѕРІР»РµРЅРёРё РєРІРёР·Р°',
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await QuizModel.delete(id, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'РљРІРёР· РЅРµ РЅР°Р№РґРµРЅ',
      });
    }

    res.json({
      success: true,
      message: 'РљРІРёР· СѓСЃРїРµС€РЅРѕ СѓРґР°Р»С‘РЅ',
    });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё СѓРґР°Р»РµРЅРёРё РєРІРёР·Р°',
    });
  }
};

export const generateQuestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, questionsCount = 5, difficulty = 'medium', type = 'multiple_choice' } = req.body;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'РўРµРјР° РѕР±СЏР·Р°С‚РµР»СЊРЅР° РґР»СЏ РіРµРЅРµСЂР°С†РёРё РІРѕРїСЂРѕСЃРѕРІ',
      });
    }

    const prompt = `РЎРіРµРЅРµСЂРёСЂСѓР№ ${questionsCount} РІРѕРїСЂРѕСЃРѕРІ РґР»СЏ РёРЅС‚РµСЂР°РєС‚РёРІРЅРѕРіРѕ С‚РµСЃС‚Р° РЅР° С‚РµРјСѓ "${topic}".

РўСЂРµР±РѕРІР°РЅРёСЏ:
- РЈСЂРѕРІРµРЅСЊ СЃР»РѕР¶РЅРѕСЃС‚Рё: ${difficulty === 'easy' ? 'Р»С‘РіРєРёР№' : difficulty === 'medium' ? 'СЃСЂРµРґРЅРёР№' : 'СЃР»РѕР¶РЅС‹Р№'}
- РўРёРї РІРѕРїСЂРѕСЃРѕРІ: ${type === 'multiple_choice' ? 'СЃ РІР°СЂРёР°РЅС‚Р°РјРё РѕС‚РІРµС‚РѕРІ (4 РІР°СЂРёР°РЅС‚Р°, 1 РїСЂР°РІРёР»СЊРЅС‹Р№)' : 'true/false'}
- Р¤РѕСЂРјР°С‚ РѕС‚РІРµС‚Р°: JSON РјР°СЃСЃРёРІ

РљР°Р¶РґС‹Р№ РІРѕРїСЂРѕСЃ РґРѕР»Р¶РµРЅ РёРјРµС‚СЊ СЃС‚СЂСѓРєС‚СѓСЂСѓ:
{
  "question": "РўРµРєСЃС‚ РІРѕРїСЂРѕСЃР°",
  "answers": [
    {"text": "РћС‚РІРµС‚ 1", "isCorrect": true},
    {"text": "РћС‚РІРµС‚ 2", "isCorrect": false},
    {"text": "РћС‚РІРµС‚ 3", "isCorrect": false},
    {"text": "РћС‚РІРµС‚ 4", "isCorrect": false}
  ],
  "explanation": "РљСЂР°С‚РєРѕРµ РѕР±СЉСЏСЃРЅРµРЅРёРµ РїСЂР°РІРёР»СЊРЅРѕРіРѕ РѕС‚РІРµС‚Р°"
}

Р’РµСЂРЅРё РўРћР›Р¬РљРћ JSON РјР°СЃСЃРёРІ РІРѕРїСЂРѕСЃРѕРІ, Р±РµР· РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕРіРѕ С‚РµРєСЃС‚Р°.`;

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
        error: 'РћС€РёР±РєР° РїСЂРё РѕР±СЂР°Р±РѕС‚РєРµ РѕС‚РІРµС‚Р° РР. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.',
      });
    }

    questions = questions.map((q, index) => ({
      ...q,
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
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РіРµРЅРµСЂР°С†РёРё РІРѕРїСЂРѕСЃРѕРІ',
    });
  }
};

export const getQuizStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await QuizModel.getStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting quiz stats:', error);
    res.status(500).json({
      success: false,
      error: 'РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃС‚Р°С‚РёСЃС‚РёРєРё',
    });
  }
};

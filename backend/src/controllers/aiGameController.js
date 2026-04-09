import { AIGameModel } from '../models/aiGames.js';
import openRouterService from '../services/openRouterService.js';

const GAME_SYSTEM_PROMPT = `Ты — генератор образовательных HTML-игр. Пользователь описывает игру, а ты создаёшь полный рабочий HTML-файл со встроенными CSS и JavaScript.

ВАЖНЫЕ ПРАВИЛА:
1. Весь код должен быть в одном HTML-файле (inline CSS в <style>, inline JS в <script>)
2. Игра должна быть красивой — используй градиенты, тени, анимации, современный дизайн
3. Игра должна быть полностью рабочей — без ошибок, с правильной логикой
4. Адаптивный дизайн — работает на мобильных и десктопах
5. Используй только чистый HTML, CSS, JavaScript — никаких внешних библиотек
6. Добавь звуковые эффекты через Web Audio API где уместно
7. Игра должна быть образовательной и интересной для студентов
8. Интерфейс на русском или казахском языке по запросу пользователя

ФОРМАТ ОТВЕТА:
Верни только HTML-код, без пояснений, без markdown-разметки. Начни с <!DOCTYPE html> и заверши </html>.`;

class AIGameController {
  async generate(req, res) {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Опишите, какую игру вы хотите создать',
        });
      }

      const messages = [
        { role: 'system', content: GAME_SYSTEM_PROMPT },
        { role: 'user', content: prompt.trim() },
      ];

      const completion = await openRouterService.chatCoder(messages);
      let htmlCode = openRouterService.extractText(completion);
      htmlCode = extractHtml(htmlCode);

      if (!htmlCode || !htmlCode.includes('<html')) {
        return res.status(500).json({
          success: false,
          error: 'AI не смог сгенерировать корректную игру. Попробуйте другой промпт.',
        });
      }

      console.log(`[AI Game] Generated for user ${userId}`);

      res.json({
        success: true,
        data: {
          html_code: htmlCode,
          prompt: prompt.trim(),
        },
      });
    } catch (error) {
      console.error('[AI Game Controller] Error generating game:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Ошибка при генерации игры',
      });
    }
  }

  async save(req, res) {
    try {
      const { title, prompt, html_code, source_lesson_plan_id } = req.body;
      const userId = req.user.id;

      if (!title || !html_code) {
        return res.status(400).json({
          success: false,
          error: 'Название и код игры обязательны',
        });
      }

      const game = await AIGameModel.create(userId, title.trim(), prompt || '', html_code, {
        source_lesson_plan_id,
      });

      res.status(201).json({
        success: true,
        data: game,
        message: 'Игра сохранена',
      });
    } catch (error) {
      console.error('[AI Game Controller] Error saving game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при сохранении игры',
      });
    }
  }

  async getAll(req, res) {
    try {
      const games = await AIGameModel.getAllByUserId(req.user.id);
      res.json({ success: true, data: games });
    } catch (error) {
      console.error('[AI Game Controller] Error getting games:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении игр',
      });
    }
  }

  async getById(req, res) {
    try {
      const game = await AIGameModel.getById(req.params.id, req.user.id);
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Игра не найдена',
        });
      }

      res.json({ success: true, data: game });
    } catch (error) {
      console.error('[AI Game Controller] Error getting game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении игры',
      });
    }
  }

  async publish(req, res) {
    try {
      const game = await AIGameModel.publish(req.params.id, req.user.id, Boolean(req.body?.is_public));

      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Игра не найдена',
        });
      }

      res.json({ success: true, data: game });
    } catch (error) {
      console.error('[AI Game Controller] Error publishing game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при изменении публикации игры',
      });
    }
  }

  async delete(req, res) {
    try {
      const game = await AIGameModel.delete(req.params.id, req.user.id);
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Игра не найдена',
        });
      }

      res.json({ success: true, message: 'Игра удалена' });
    } catch (error) {
      console.error('[AI Game Controller] Error deleting game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении игры',
      });
    }
  }
}

function extractHtml(text) {
  if (!text) return '';

  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  const htmlMatch = text.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  const htmlMatch2 = text.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlMatch2) {
    return htmlMatch2[1].trim();
  }

  return text.trim();
}

export default new AIGameController();

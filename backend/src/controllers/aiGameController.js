import { AIGameModel } from '../models/aiGames.js';
import aiService from '../services/aiService.js';

const GAME_SYSTEM_PROMPT = `Ты — генератор образовательных HTML-игр. Пользователь описывает игру, а ты создаёшь ПОЛНЫЙ, РАБОЧИЙ HTML-файл с встроенными CSS и JavaScript.

ВАЖНЫЕ ПРАВИЛА:
1. Весь код должен быть в ОДНОМ HTML-файле (inline CSS в <style>, inline JS в <script>)
2. Игра должна быть КРАСИВОЙ — используй градиенты, тени, анимации, современный дизайн
3. Игра должна быть ПОЛНОСТЬЮ РАБОЧАЯ — без ошибок, с правильной логикой
4. Адаптивный дизайн — работает на мобильных и десктопах
5. Используй только чистый HTML, CSS, JavaScript — никаких внешних библиотек
6. Добавь звуковые эффекты через Web Audio API где уместно
7. Игра должна быть ОБРАЗОВАТЕЛЬНОЙ и интересной для студентов
8. Интерфейс на русском или казахском языке (по запросу пользователя)

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО HTML-код, без пояснений, без markdown-разметки. Начни с <!DOCTYPE html> и заверши </html>.
Никакого текста до или после HTML-кода.`;

class AIGameController {
  /**
   * Сгенерировать игру
   * POST /api/ai-games/generate
   */
  async generate(req, res) {
    try {
      const { prompt } = req.body;
      const userId = req.user.id;

      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Опишите какую игру вы хотите создать'
        });
      }

      console.log(`[AI Game] Генерация игры для пользователя ${userId}: "${prompt.substring(0, 80)}..."`);

      const fullMessage = `${GAME_SYSTEM_PROMPT}\n\nЗапрос пользователя: ${prompt.trim()}`;

      const result = await aiService.sendMessage(fullMessage, userId, 'game-generation');

      let htmlCode = '';
      if (result.data) {
        htmlCode = result.data.response || result.data.message || result.data.text || result.data.output || '';
        if (typeof htmlCode === 'object') {
          htmlCode = JSON.stringify(htmlCode);
        }
      }

      // Извлекаем HTML из возможной markdown-обёртки
      htmlCode = extractHtml(htmlCode);

      if (!htmlCode || !htmlCode.includes('<html')) {
        return res.status(500).json({
          success: false,
          error: 'AI не смог сгенерировать корректную игру. Попробуйте другой промпт.'
        });
      }

      res.json({
        success: true,
        data: {
          html_code: htmlCode,
          prompt: prompt.trim()
        }
      });
    } catch (error) {
      console.error('[AI Game Controller] Error generating game:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Ошибка при генерации игры'
      });
    }
  }

  /**
   * Сохранить сгенерированную игру
   * POST /api/ai-games/save
   */
  async save(req, res) {
    try {
      const { title, prompt, html_code } = req.body;
      const userId = req.user.id;

      if (!title || !html_code) {
        return res.status(400).json({
          success: false,
          error: 'Название и код игры обязательны'
        });
      }

      const game = await AIGameModel.create(userId, title.trim(), prompt || '', html_code);

      res.status(201).json({
        success: true,
        data: game,
        message: 'Игра сохранена'
      });
    } catch (error) {
      console.error('[AI Game Controller] Error saving game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при сохранении игры'
      });
    }
  }

  /**
   * Получить все сохранённые игры
   * GET /api/ai-games
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const games = await AIGameModel.getAllByUserId(userId);

      res.json({
        success: true,
        data: games
      });
    } catch (error) {
      console.error('[AI Game Controller] Error getting games:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении игр'
      });
    }
  }

  /**
   * Получить игру по ID (с HTML-кодом)
   * GET /api/ai-games/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const game = await AIGameModel.getById(id, userId);
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Игра не найдена'
        });
      }

      res.json({
        success: true,
        data: game
      });
    } catch (error) {
      console.error('[AI Game Controller] Error getting game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении игры'
      });
    }
  }

  /**
   * Удалить игру
   * DELETE /api/ai-games/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const game = await AIGameModel.delete(id, userId);
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Игра не найдена'
        });
      }

      res.json({
        success: true,
        message: 'Игра удалена'
      });
    } catch (error) {
      console.error('[AI Game Controller] Error deleting game:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении игры'
      });
    }
  }
}

/**
 * Извлечь HTML из markdown-обёртки если есть
 */
function extractHtml(text) {
  if (!text) return '';

  // Убираем markdown code blocks
  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Ищем <!DOCTYPE html> ... </html>
  const htmlMatch = text.match(/(<!DOCTYPE html[\s\S]*<\/html>)/i);
  if (htmlMatch) {
    return htmlMatch[1].trim();
  }

  // Ищем <html> ... </html>
  const htmlMatch2 = text.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlMatch2) {
    return htmlMatch2[1].trim();
  }

  return text.trim();
}

export default new AIGameController();

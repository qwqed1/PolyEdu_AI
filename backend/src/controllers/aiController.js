import aiService from '../services/aiService.js';

class AIController {
  /**
   * Отправка сообщения в AI чат
   * POST /api/ai/chat
   */
  async sendMessage(req, res) {
    try {
      // Проверка авторизации
      if (!req.user || !req.user.id) {
        console.error('[AI Controller] req.user не определен:', req.user);
        return res.status(401).json({
          success: false,
          error: 'Необходима авторизация. Пожалуйста, войдите в систему.'
        });
      }

      const { message, context } = req.body;
      const userId = req.user.id;

      // Валидация
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Сообщение не может быть пустым'
        });
      }

      if (message.length > 10000) {
        return res.status(400).json({
          success: false,
          error: 'Сообщение слишком длинное (максимум 10000 символов)'
        });
      }

      console.log(`[AI Controller] Получен запрос от пользователя ${userId}`);
      console.log(`[AI Controller] Сообщение: "${message.substring(0, 50)}..."`);

      // Отправка в Gemini Agent
      const result = await aiService.sendMessage(
        message.trim(),
        userId,
        context || ''
      );

      console.log(`[AI Controller] Ответ от Gemini Agent получен успешно`);

      res.json({
        success: true,
        message: 'Сообщение успешно отправлено',
        data: result.data
      });

    } catch (error) {
      console.error('[AI Controller] Ошибка:', error.message);
      console.error('[AI Controller] Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Ошибка при обработке запроса'
      });
    }
  }

  /**
   * Проверка здоровья AI сервиса
   * GET /api/ai/health
   */
  async healthCheck(req, res) {
    try {
      const isHealthy = await aiService.healthCheck();
      
      res.json({
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        engine: 'gemini-agent'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Не удалось проверить состояние AI сервиса'
      });
    }
  }
}

export default new AIController();

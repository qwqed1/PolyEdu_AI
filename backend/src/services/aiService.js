import openRouterAgent from './openRouterAgent.js';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.timeout = 120000; // 120 секунд
  }

  /**
   * Отправка сообщения в AI агент AIZERT (OpenRouter gpt-oss-120b)
   * @param {string} message - Сообщение пользователя
   * @param {number} userId - ID пользователя
   * @param {string} context - Дополнительный контекст (опционально)
   * @returns {Promise<object>} Ответ от AI
   */
  async sendMessage(message, userId, context = '') {
    try {
      console.log(`[AI Service] ==========================================`);
      console.log(`[AI Service] Запрос от пользователя ${userId}`);
      console.log(`[AI Service] Провайдер: OpenRouter (text model)`);

      const fullMessage = context ? `${context}\n\n${message}` : message;

      console.log(`[AI Service] Сообщение: "${fullMessage.substring(0, 100)}..."`);

      const startTime = Date.now();

      const result = await openRouterAgent.chat(fullMessage, userId);

      const duration = Date.now() - startTime;
      console.log(`[AI Service] Ответ получен за ${duration}ms`);

      const responseMessage = result.message || JSON.stringify(result);

      return {
        success: true,
        data: {
          response: responseMessage,
          rawData: result,
        },
      };
    } catch (error) {
      console.error('[AI Service] Ошибка:', error.message);
      console.error('[AI Service] Stack:', error.stack);

      // Пробрасываем реальную ошибку OpenRouter без подмены
      throw new Error(error.message || 'Неизвестная ошибка при обращении к AI');
    }
  }

  /**
   * Проверка доступности OpenRouter API
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      return await openRouterAgent.healthCheck();
    } catch (error) {
      console.error('[AI Service] Health check failed:', error.message);
      return false;
    }
  }
}

export default new AIService();

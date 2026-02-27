import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
    this.timeout = 180000; // 180 seconds timeout для генерации планов
  }

  /**
   * Отправка сообщения в n8n AI агент
   * @param {string} message - Сообщение пользователя
   * @param {number} userId - ID пользователя
   * @param {string} context - Дополнительный контекст (опционально)
   * @returns {Promise<object>} Ответ от AI агента
   */
  async sendMessage(message, userId, context = '') {
    try {
      console.log(`[AI Service] ==========================================`);
      console.log(`[AI Service] Отправка сообщения в n8n для пользователя ${userId}`);
      console.log(`[AI Service] Webhook URL: ${this.webhookUrl}`);
      console.log(`[AI Service] Timeout: ${this.timeout}ms`);
      
      const payload = {
        message,
        userId,
        context,
        timestamp: new Date().toISOString()
      };

      console.log(`[AI Service] Payload:`, JSON.stringify(payload, null, 2));

      const startTime = Date.now();
      console.log(`[AI Service] Отправка запроса... (${new Date().toISOString()})`);

      const response = await axios.post(this.webhookUrl, payload, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const duration = Date.now() - startTime;
      console.log(`[AI Service] Получен ответ от n8n (status ${response.status}) за ${duration}ms`);

      console.log(`[AI Service] Получен ответ от n8n (status ${response.status})`);
      console.log(`[AI Service] Response data:`, JSON.stringify(response.data, null, 2));
      
      // Обработка различных форматов ответов от n8n
      let responseMessage = response.data;
      
      // Если ответ - это объект с полем message/response/text
      if (typeof response.data === 'object') {
        responseMessage = response.data.message || 
                         response.data.response || 
                         response.data.text ||
                         response.data.output ||
                         JSON.stringify(response.data);
      }
      
      return {
        success: true,
        data: {
          response: responseMessage,
          rawData: response.data
        }
      };
    } catch (error) {
      console.error('[AI Service] Ошибка при запросе к n8n:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Превышено время ожидания ответа от AI агента');
      }
      
      if (error.response) {
        console.error('[AI Service] Response error:', error.response.data);
        throw new Error(`Ошибка AI агента: ${error.response.status} - ${error.response.statusText}`);
      }
      
      if (error.request) {
        throw new Error('AI агент недоступен. Проверьте подключение к интернету');
      }
      
      throw new Error('Неизвестная ошибка при обращении к AI агенту');
    }
  }

  /**
   * Проверка доступности n8n webhook
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      const response = await axios.get(this.webhookUrl, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('[AI Service] Health check failed:', error.message);
      return false;
    }
  }
}

export default new AIService();

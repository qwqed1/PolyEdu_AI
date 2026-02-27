import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

class OpenRouterService {
  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('[OpenRouter] ⚠️  OPENROUTER_API_KEY не задан в .env!');
    }

    this.client = axios.create({
      baseURL: OPENROUTER_BASE_URL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://collegeeduai.kz',
        'X-Title': 'CollegeEduAI',
      },
      timeout: 120000, // 120 сек
    });

    // Текстовая модель — для чата, квизов
    this.textModel = process.env.OPENROUTER_TEXT_MODEL || 'openai/gpt-4.5:free';

    // Модель кодирования — для генерации HTML-игр
    this.coderModel = process.env.OPENROUTER_CODER_MODEL || 'qwen/qwen3-coder-480b-a35b:free';

    // Модель для планов уроков — стабильный JSON
    this.lessonModel = process.env.OPENROUTER_LESSON_MODEL || 'google/gemma-3-27b-it:free';

    console.log(`[OpenRouter] Text model:   ${this.textModel}`);
    console.log(`[OpenRouter] Coder model:  ${this.coderModel}`);
    console.log(`[OpenRouter] Lesson model: ${this.lessonModel}`);
  }

  /**
   * Отправить запрос к текстовой модели (gpt-oss-120b).
   * Поддерживает function calling (tools).
   * @param {Array} messages - массив { role, content }
   * @param {Array|null} tools - массив tool definitions (OpenAI format) или null
   * @param {string} toolChoice - 'auto' | 'none' | 'required'
   * @returns {Promise<Object>} - полный ответ OpenAI-compatible completion
   */
  async chatText(messages, tools = null, toolChoice = 'auto') {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body = {
          model: this.textModel,
          messages,
          temperature: 0.7,
          max_tokens: 16384,
        };

        if (tools && tools.length > 0) {
          body.tools = tools;
          body.tool_choice = toolChoice;
        }

        console.log(`[OpenRouter] chatText → ${this.textModel} (попытка ${attempt}/${MAX_RETRIES}, tools: ${!!tools})`);
        const response = await this.client.post('/chat/completions', body);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message || '';
        console.warn(`[OpenRouter] chatText попытка ${attempt} неудачна: ${errMsg}`);

        // Если модель не поддерживает tools — повтор без них
        if (tools && tools.length > 0 && attempt === 1) {
          console.warn(`[OpenRouter] Повторяю без tools...`);
          tools = null;
          continue;
        }

        if (attempt < MAX_RETRIES) {
          const delay = attempt * 2000;
          console.log(`[OpenRouter] Ждём ${delay}ms перед повтором...`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          this._handleError(error, 'chatText');
        }
      }
    }
  }

  /**
   * Отправить запрос к coder-модели (Qwen3 Coder).
   * С автоматическим retry (3 попытки) и fallback на текстовую модель.
   * @param {Array} messages - массив { role, content }
   * @returns {Promise<Object>} - полный ответ OpenAI-compatible completion
   */
  async chatCoder(messages) {
    const MAX_RETRIES = 3;

    // Попытки с coder-моделью
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body = {
          model: this.coderModel,
          messages,
          temperature: 0.2,
          max_tokens: 8192,
        };

        console.log(`[OpenRouter] chatCoder → ${this.coderModel} (попытка ${attempt}/${MAX_RETRIES})`);
        const response = await this.client.post('/chat/completions', body);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message || '';
        console.warn(`[OpenRouter] chatCoder попытка ${attempt} неудачна: ${errMsg}`);

        if (attempt < MAX_RETRIES) {
          const delay = attempt * 2000; // 2с, 4с
          console.log(`[OpenRouter] Ждём ${delay}ms перед повтором...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    // Fallback: используем текстовую модель
    console.warn(`[OpenRouter] Coder-модель недоступна после ${MAX_RETRIES} попыток. Fallback на ${this.textModel}`);
    try {
      const body = {
        model: this.textModel,
        messages,
        temperature: 0.3,
        max_tokens: 8192,
      };
      const response = await this.client.post('/chat/completions', body);
      return response.data;
    } catch (error) {
      this._handleError(error, 'chatCoder-fallback');
    }
  }

  /**
   * Отправить запрос к lesson-модели (Gemma 3 27B).
   * Для генерации планов уроков в JSON.
   * @param {Array} messages - массив { role, content }
   * @returns {Promise<Object>} - полный ответ OpenAI-compatible completion
   */
  async chatLesson(messages) {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const body = {
          model: this.lessonModel,
          messages,
          temperature: 0.3,
          max_tokens: 16384,
        };

        console.log(`[OpenRouter] chatLesson → ${this.lessonModel} (попытка ${attempt}/${MAX_RETRIES})`);
        const response = await this.client.post('/chat/completions', body);
        return response.data;
      } catch (error) {
        const errMsg = error.response?.data?.error?.message || error.message || '';
        console.warn(`[OpenRouter] chatLesson попытка ${attempt} неудачна: ${errMsg}`);

        if (attempt < MAX_RETRIES) {
          const delay = attempt * 2000;
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    // Fallback на textModel
    console.warn(`[OpenRouter] Lesson-модель недоступна. Fallback на ${this.textModel}`);
    try {
      const body = {
        model: this.textModel,
        messages,
        temperature: 0.3,
        max_tokens: 16384,
      };
      const response = await this.client.post('/chat/completions', body);
      return response.data;
    } catch (error) {
      this._handleError(error, 'chatLesson-fallback');
    }
  }

  /**
   * Вспомогательный метод — извлечь текст из completion response
   */
  extractText(completion) {
    return completion?.choices?.[0]?.message?.content || '';
  }

  /**
   * Вспомогательный метод — извлечь tool_calls из completion response
   */
  extractToolCalls(completion) {
    return completion?.choices?.[0]?.message?.tool_calls || [];
  }

  /**
   * Вспомогательный метод — получить message object из completion
   */
  extractMessage(completion) {
    return completion?.choices?.[0]?.message || null;
  }

  _handleError(error, method) {
    const status = error.response?.status;
    const data = error.response?.data;
    const realMessage = data?.error?.message || error.message || 'Ошибка OpenRouter API';
    console.error(`[OpenRouter] Ошибка в ${method}: HTTP ${status}`);
    console.error(`[OpenRouter] Ответ:`, JSON.stringify(data));

    // Пробрасываем реальное сообщение от API — без подмены
    throw new Error(realMessage);
  }
}

export default new OpenRouterService();

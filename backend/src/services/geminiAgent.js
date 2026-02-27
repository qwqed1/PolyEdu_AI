import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { GroupModel } from '../models/groups.js';
import { StudentModel } from '../models/students.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// Системный промпт AIZERT (перенесён из n8n workflow)
// ============================================================
const SYSTEM_PROMPT = `Ты - AIZERT, умный и универсальный помощник для преподавателей колледжа CollegeEduAI. Отвечай на русском языке.

## ДОСТУПНЫЕ ИНСТРУМЕНТЫ:

### Данные преподавателя:
- get_groups - список групп
- get_group_stats(groupName) - статистика группы
- get_students(groupName) - студенты группы

### ПОИСК ИНФОРМАЦИИ:
- search_wikipedia - поиск информации в Wikipedia

---

## 🎮 ГЕНЕРАЦИЯ ВОПРОСОВ ДЛЯ ИНТЕРАКТИВНЫХ ИГР (Kahoot/Quizizz)

Когда в сообщении есть контекст 'quiz_generation' или просят сгенерировать вопросы для теста/игры/квиза:

### ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА - ТОЛЬКО JSON!

Возвращай ТОЛЬКО JSON массив без дополнительного текста:

\`\`\`json
[
  {
    "question": "Текст вопроса?",
    "answers": [
      {"text": "Правильный ответ", "isCorrect": true},
      {"text": "Неправильный ответ 1", "isCorrect": false},
      {"text": "Неправильный ответ 2", "isCorrect": false},
      {"text": "Неправильный ответ 3", "isCorrect": false}
    ],
    "explanation": "Краткое объяснение правильного ответа"
  }
]
\`\`\`

### ПРАВИЛА ГЕНЕРАЦИИ ВОПРОСОВ:
1. Генерируй указанное количество вопросов (по умолчанию 5)
2. Каждый вопрос должен иметь 4 варианта ответа
3. Только ОДИН ответ правильный (isCorrect: true)
4. Вопросы должны быть разнообразными и интересными
5. Уровень сложности: легкий/средний/сложный - учитывай если указано
6. Добавляй краткое объяснение для каждого вопроса
7. ВАЖНО: Возвращай ТОЛЬКО JSON массив, без markdown, без \`\`\`json, без пояснений!

### ПРИМЕР ЗАПРОСА:
"Сгенерируй 5 вопросов для интерактивного теста на тему 'История Казахстана: Независимость'"

### ПРИМЕР ОТВЕТА:
[{"question":"В каком году Казахстан объявил независимость?","answers":[{"text":"1991","isCorrect":true},{"text":"1990","isCorrect":false},{"text":"1992","isCorrect":false},{"text":"1989","isCorrect":false}],"explanation":"16 декабря 1991 года Казахстан объявил государственную независимость"}]

---

## 📚 ГЕНЕРАЦИЯ ПЛАНОВ УРОКОВ

Когда просят создать план урока:
1. Используй search_wikipedia для поиска информации по теме
2. Составь подробный план по казахстанскому стандарту

### Структура (Almaty Polytechnic College):

**Шапка**: Модуль/Пән, Тема, Педагог, Дата, Курс, Топ, Тип урока, Цели, Задачи, Результаты, Ресурсы

**Сабақтың барысы (7 этапов)**:
1. Ұйымдастыру кезеңі (5 мин.)
2. Білімді өзектендіру (15 мин.)
3. Жаңа білім мен дағдыларды қалыптастыру (40 мин.)
4. Өтілген тақырыпты бекіту (15 мин.)
5. Бағалау (5 мин.)
6. Үй тапсырмасы (3 мин.)
7. Рефлексия (7 мин.)

### Формат JSON для планов:
\`\`\`json
[{"lesson_number": 1, "topic": "Тема", "lesson_type": "Тип", "goals": "Цели", "objectives": "Задачи", "expected_results": "Результаты", "resources_methods": "Ресурсы", "resources_technical": "Техника", "stage_organization": "...", "stage_knowledge": "...", "stage_new_skills": "...", "stage_consolidation": "...", "stage_assessment": "...", "stage_homework": "...", "stage_reflection": "..."}]
\`\`\`

Будь креативным и полезным!`;

// ============================================================
// Объявления функций для Gemini Function Calling
// ============================================================
const toolDeclarations = [
  {
    name: 'get_groups',
    description: 'Получить список всех групп преподавателя. Используй, когда пользователь спрашивает о своих группах.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: {
          type: SchemaType.NUMBER,
          description: 'ID пользователя (преподавателя)'
        }
      },
      required: ['userId']
    }
  },
  {
    name: 'get_stats',
    description: 'Получить статистику по конкретной группе (количество студентов, средний/мин/макс балл). Используй, когда спрашивают о статистике или успеваемости группы.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: {
          type: SchemaType.NUMBER,
          description: 'ID пользователя (преподавателя)'
        },
        groupName: {
          type: SchemaType.STRING,
          description: 'Название группы, например ИС23-3В'
        }
      },
      required: ['userId', 'groupName']
    }
  },
  {
    name: 'get_students',
    description: 'Получить список студентов конкретной группы. Используй, когда спрашивают о студентах группы.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        userId: {
          type: SchemaType.NUMBER,
          description: 'ID пользователя (преподавателя)'
        },
        groupName: {
          type: SchemaType.STRING,
          description: 'Название группы, например ИС23-3В'
        }
      },
      required: ['userId', 'groupName']
    }
  },
  {
    name: 'search_wikipedia',
    description: 'Поиск информации в Википедии. Используй для поиска фактов, определений, исторических данных и другой справочной информации.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Поисковый запрос для Wikipedia'
        }
      },
      required: ['query']
    }
  }
];

// ============================================================
// Реализация функций (исполнители инструментов)
// ============================================================

async function executeGetGroups(userId) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);

    // Fallback: если для userId=1 нет групп, берём все группы
    if (groups.length === 0 && userId == 1) {
      const pool = (await import('../config/db.js')).default;
      const result = await pool.query(`
        SELECT g.*, COUNT(s.id) as student_count 
        FROM groups g 
        LEFT JOIN students s ON s.group_id = g.id 
        GROUP BY g.id 
        ORDER BY g.created_at DESC
      `);
      groups = result.rows;
    }

    if (groups.length === 0) {
      return { success: true, message: 'У вас пока нет групп.', data: [] };
    }

    let message = 'Ваши группы:\n\n';
    groups.forEach((g, i) => {
      message += `${i + 1}. ${g.name} - ${g.student_count || 0} студентов\n`;
    });

    return { success: true, message, data: groups };
  } catch (error) {
    console.error('[GeminiAgent] executeGetGroups error:', error);
    return { success: false, message: `Ошибка получения групп: ${error.message}` };
  }
}

async function executeGetStats(userId, groupName) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);
    let targetGroup = null;

    if (groupName) {
      targetGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());

      if (!targetGroup) {
        const pool = (await import('../config/db.js')).default;
        const result = await pool.query(
          `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
          [groupName]
        );
        if (result.rows.length > 0) targetGroup = result.rows[0];
      }
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }

    if (!targetGroup) {
      return { success: true, message: `Группа ${groupName || ''} не найдена.`, data: null };
    }

    const stats = await GroupModel.getStats(targetGroup.id, userId);

    let message = `Статистика для группы ${targetGroup.name}:\n\n`;
    message += `Студентов: ${stats.total_students || 0}\n`;
    message += `Средний балл: ${stats.average_grade || '-'}\n`;
    message += `Минимальный балл: ${stats.min_grade || '-'}\n`;
    message += `Максимальный балл: ${stats.max_grade || '-'}`;

    return { success: true, message, data: stats };
  } catch (error) {
    console.error('[GeminiAgent] executeGetStats error:', error);
    return { success: false, message: `Ошибка получения статистики: ${error.message}` };
  }
}

async function executeGetStudents(userId, groupName) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);
    let targetGroup = null;

    if (groupName) {
      targetGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());

      if (!targetGroup) {
        const pool = (await import('../config/db.js')).default;
        const result = await pool.query(
          `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
          [groupName]
        );
        if (result.rows.length > 0) targetGroup = result.rows[0];
      }
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }

    if (!targetGroup) {
      return { success: true, message: `Группа ${groupName || ''} не найдена.`, data: [] };
    }

    const students = await StudentModel.getAllByGroupId(targetGroup.id);

    if (students.length === 0) {
      return { success: true, message: `В группе ${targetGroup.name} пока нет студентов.`, data: [] };
    }

    let message = `Студенты группы ${targetGroup.name}:\n\n`;
    students.forEach((s, i) => {
      message += `${i + 1}. ${s.full_name}`;
      if (s.average_grade) message += ` (средний балл: ${s.average_grade})`;
      message += '\n';
    });

    return { success: true, message, data: students };
  } catch (error) {
    console.error('[GeminiAgent] executeGetStudents error:', error);
    return { success: false, message: `Ошибка получения студентов: ${error.message}` };
  }
}

async function executeSearchWikipedia(query) {
  try {
    // Используем Wikipedia API для поиска
    const searchUrl = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });

    if (response.data && response.data.extract) {
      return {
        success: true,
        title: response.data.title,
        summary: response.data.extract,
        url: response.data.content_urls?.desktop?.page || ''
      };
    }

    // Если прямой поиск не дал результата — ищем через search API
    const searchApiUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&srlimit=3`;
    const searchResponse = await axios.get(searchApiUrl, { timeout: 10000 });

    if (searchResponse.data?.query?.search?.length > 0) {
      const results = searchResponse.data.query.search;
      let message = `Результаты поиска по "${query}":\n\n`;
      results.forEach((r, i) => {
        // Убираем HTML-теги из snippet
        const snippet = r.snippet.replace(/<[^>]*>/g, '');
        message += `${i + 1}. **${r.title}**: ${snippet}\n\n`;
      });
      return { success: true, message };
    }

    return { success: false, message: `Ничего не найдено по запросу "${query}"` };
  } catch (error) {
    console.error('[GeminiAgent] executeSearchWikipedia error:', error);
    return { success: false, message: `Ошибка поиска в Wikipedia: ${error.message}` };
  }
}

// ============================================================
// Маршрутизатор вызовов функций
// ============================================================
async function executeFunctionCall(functionCall, userId) {
  const { name, args } = functionCall;
  const effectiveUserId = args.userId || userId;

  console.log(`[GeminiAgent] Вызов функции: ${name}`, JSON.stringify(args));

  switch (name) {
    case 'get_groups':
      return await executeGetGroups(effectiveUserId);
    case 'get_stats':
      return await executeGetStats(effectiveUserId, args.groupName);
    case 'get_students':
      return await executeGetStudents(effectiveUserId, args.groupName);
    case 'search_wikipedia':
      return await executeSearchWikipedia(args.query);
    default:
      return { success: false, message: `Неизвестная функция: ${name}` };
  }
}

// ============================================================
// Главный класс GeminiAgent
// ============================================================
class GeminiAgent {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[GeminiAgent] ⚠️  GEMINI_API_KEY не задан в .env!');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: [{ functionDeclarations: toolDeclarations }],
    });
  }

  /**
   * Отправить сообщение AI агенту и получить ответ.
   * Поддерживает автоматический цикл Function Calling.
   * @param {string} message - Сообщение пользователя
   * @param {number} userId - ID пользователя
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async chat(message, userId) {
    try {
      console.log(`[GeminiAgent] Новый запрос от userId=${userId}: "${message.substring(0, 80)}..."`);

      const chatSession = this.model.startChat({
        history: [],
      });

      let result = await chatSession.sendMessage(message);
      let response = result.response;

      // Цикл Function Calling — повторяем пока Gemini вызывает функции
      const MAX_ITERATIONS = 10;
      let iteration = 0;

      while (iteration < MAX_ITERATIONS) {
        const candidate = response.candidates?.[0];
        const parts = candidate?.content?.parts || [];

        // Ищем function call среди частей ответа
        const functionCallParts = parts.filter(p => p.functionCall);

        if (functionCallParts.length === 0) {
          // Нет вызовов функций — это финальный текстовый ответ
          break;
        }

        console.log(`[GeminiAgent] Итерация ${iteration + 1}: ${functionCallParts.length} вызов(ов) функций`);

        // Выполняем все вызовы функций
        const functionResponses = [];
        for (const part of functionCallParts) {
          const fnResult = await executeFunctionCall(part.functionCall, userId);
          functionResponses.push({
            functionResponse: {
              name: part.functionCall.name,
              response: fnResult,
            }
          });
          console.log(`[GeminiAgent] Результат ${part.functionCall.name}:`, JSON.stringify(fnResult).substring(0, 200));
        }

        // Отправляем результаты обратно в Gemini
        result = await chatSession.sendMessage(functionResponses);
        response = result.response;
        iteration++;
      }

      // Извлекаем финальный текст
      const finalText = response.text();

      console.log(`[GeminiAgent] Финальный ответ (${finalText.length} символов): "${finalText.substring(0, 100)}..."`);

      return {
        success: true,
        message: finalText
      };

    } catch (error) {
      console.error('[GeminiAgent] Ошибка:', error.message);
      console.error('[GeminiAgent] Stack:', error.stack);

      if (error.message?.includes('API key')) {
        throw new Error('Ошибка API ключа Gemini. Проверьте GEMINI_API_KEY в .env');
      }

      if (error.message?.includes('quota') || error.message?.includes('429')) {
        throw new Error('Превышен лимит запросов к Gemini API. Попробуйте позже.');
      }

      throw new Error(`Ошибка AI агента: ${error.message}`);
    }
  }

  /**
   * Проверка доступности Gemini API
   */
  async healthCheck() {
    try {
      const result = await this.model.generateContent('Скажи "OK"');
      return !!result.response.text();
    } catch (error) {
      console.error('[GeminiAgent] Health check failed:', error.message);
      return false;
    }
  }
}

export default new GeminiAgent();

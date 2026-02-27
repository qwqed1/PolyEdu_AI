/**
 * openRouterAgent.js — замена geminiAgent.js
 * Использует OpenRouter (gpt-oss-120b) для чата AIZERT.
 * Поддерживает function calling (OpenAI-compatible format).
 */

import openRouterService from './openRouterService.js';
import { GroupModel } from '../models/groups.js';
import { StudentModel } from '../models/students.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================
// Системный промпт AIZERT
// ============================================================
const SYSTEM_PROMPT = `Ты - AIZERT, умный и универсальный помощник для преподавателей и студентов колледжа CollegeEduAI. Отвечай на русском языке.

## ДОСТУПНЫЕ ИНСТРУМЕНТЫ:
- get_groups — список групп преподавателя
- get_stats(groupName) — статистика группы
- get_students(groupName) — студенты группы
- search_wikipedia(query) — поиск информации в Wikipedia

---

## 🎮 ГЕНЕРАЦИЯ ВОПРОСОВ ДЛЯ ИНТЕРАКТИВНЫХ ИГР (Kahoot/Quizizz)

Когда в сообщении есть контекст 'quiz_generation' или просят сгенерировать вопросы для теста/игры/квиза:

### ОБЯЗАТЕЛЬНЫЙ ФОРМАТ ОТВЕТА - ТОЛЬКО JSON!

Возвращай ТОЛЬКО JSON массив без дополнительного текста:

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

### ПРАВИЛА ГЕНЕРАЦИИ ВОПРОСОВ:
1. Генерируй указанное количество вопросов (по умолчанию 5)
2. Каждый вопрос должен иметь 4 варианта ответа
3. Только ОДИН ответ правильный (isCorrect: true)
4. Вопросы должны быть разнообразными и интересными
5. ВАЖНО: Возвращай ТОЛЬКО JSON массив, без markdown, без \`\`\`json, без пояснений!

---

## 📚 ГЕНЕРАЦИЯ ПЛАНОВ УРОКОВ

Когда просят создать план урока — составь подробный план по казахстанскому стандарту.

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
[{"lesson_number": 1, "topic": "Тема", "lesson_type": "Тип", "goals": "Цели", "objectives": "Задачи", "expected_results": "Результаты", "resources_methods": "Ресурсы", "resources_technical": "Техника", "stage_organization": "...", "stage_knowledge": "...", "stage_new_skills": "...", "stage_consolidation": "...", "stage_assessment": "...", "stage_homework": "...", "stage_reflection": "..."}]

Будь креативным и полезным!`;

// ============================================================
// Tool definitions (OpenAI function calling format)
// ============================================================
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_groups',
      description: 'Получить список всех групп преподавателя. Используй, когда пользователь спрашивает о своих группах.',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'number', description: 'ID пользователя (преподавателя)' },
        },
        required: ['userId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stats',
      description: 'Получить статистику по конкретной группе. Используй когда спрашивают об успеваемости.',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'number', description: 'ID пользователя (преподавателя)' },
          groupName: { type: 'string', description: 'Название группы, например ИС23-3В' },
        },
        required: ['userId', 'groupName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_students',
      description: 'Получить список студентов конкретной группы.',
      parameters: {
        type: 'object',
        properties: {
          userId: { type: 'number', description: 'ID пользователя' },
          groupName: { type: 'string', description: 'Название группы' },
        },
        required: ['userId', 'groupName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_wikipedia',
      description: 'Поиск информации в Википедии. Используй для поиска фактов и справочной информации.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Поисковый запрос для Wikipedia' },
        },
        required: ['query'],
      },
    },
  },
];

// ============================================================
// Реализация функций (tool executors)
// ============================================================

async function executeGetGroups(userId) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);

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
      return 'У вас пока нет групп.';
    }

    let message = 'Ваши группы:\n\n';
    groups.forEach((g, i) => {
      message += `${i + 1}. ${g.name} — ${g.student_count || 0} студентов\n`;
    });
    return message;
  } catch (error) {
    console.error('[OpenRouterAgent] executeGetGroups error:', error);
    return `Ошибка получения групп: ${error.message}`;
  }
}

async function executeGetStats(userId, groupName) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);
    let targetGroup = groups.find(g => g.name.toLowerCase() === groupName?.toLowerCase());

    if (!targetGroup) {
      const pool = (await import('../config/db.js')).default;
      const result = await pool.query(
        `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
        [groupName]
      );
      if (result.rows.length > 0) targetGroup = result.rows[0];
    }

    if (!targetGroup) return `Группа "${groupName}" не найдена.`;

    const stats = await GroupModel.getStats(targetGroup.id, userId);
    return `Статистика группы ${targetGroup.name}:\n` +
      `Студентов: ${stats.total_students || 0}\n` +
      `Средний балл: ${stats.average_grade || '-'}\n` +
      `Мин: ${stats.min_grade || '-'} / Макс: ${stats.max_grade || '-'}`;
  } catch (error) {
    console.error('[OpenRouterAgent] executeGetStats error:', error);
    return `Ошибка получения статистики: ${error.message}`;
  }
}

async function executeGetStudents(userId, groupName) {
  try {
    let groups = await GroupModel.getAllByUserId(userId);
    let targetGroup = groups.find(g => g.name.toLowerCase() === groupName?.toLowerCase());

    if (!targetGroup) {
      const pool = (await import('../config/db.js')).default;
      const result = await pool.query(
        `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
        [groupName]
      );
      if (result.rows.length > 0) targetGroup = result.rows[0];
    }

    if (!targetGroup) return `Группа "${groupName}" не найдена.`;

    const students = await StudentModel.getAllByGroupId(targetGroup.id);
    if (students.length === 0) return `В группе ${targetGroup.name} пока нет студентов.`;

    let message = `Студенты группы ${targetGroup.name}:\n\n`;
    students.forEach((s, i) => {
      message += `${i + 1}. ${s.full_name}`;
      if (s.average_grade) message += ` (ср. балл: ${s.average_grade})`;
      message += '\n';
    });
    return message;
  } catch (error) {
    console.error('[OpenRouterAgent] executeGetStudents error:', error);
    return `Ошибка получения студентов: ${error.message}`;
  }
}

async function executeSearchWikipedia(query) {
  try {
    const url = `https://ru.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data?.extract) {
      return `**${response.data.title}**\n\n${response.data.extract}`;
    }

    // Fallback — поиск через API
    const searchUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&srlimit=3`;
    const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
    const results = searchResponse.data?.query?.search || [];

    if (results.length === 0) return `Ничего не найдено по запросу "${query}"`;

    let message = `Результаты поиска "${query}":\n\n`;
    results.forEach((r, i) => {
      const snippet = r.snippet.replace(/<[^>]*>/g, '');
      message += `${i + 1}. **${r.title}**: ${snippet}\n\n`;
    });
    return message;
  } catch (error) {
    console.error('[OpenRouterAgent] executeSearchWikipedia error:', error);
    return `Ошибка поиска в Wikipedia: ${error.message}`;
  }
}

async function executeTool(toolName, args, userId) {
  console.log(`[OpenRouterAgent] Вызов инструмента: ${toolName}`, JSON.stringify(args));
  const effectiveUserId = args.userId || userId;

  switch (toolName) {
    case 'get_groups':   return await executeGetGroups(effectiveUserId);
    case 'get_stats':    return await executeGetStats(effectiveUserId, args.groupName);
    case 'get_students': return await executeGetStudents(effectiveUserId, args.groupName);
    case 'search_wikipedia': return await executeSearchWikipedia(args.query);
    default: return `Неизвестный инструмент: ${toolName}`;
  }
}

// ============================================================
// Главный класс OpenRouterAgent
// ============================================================
class OpenRouterAgent {
  /**
   * Отправить сообщение AI-агенту.
   * Поддерживает автоматический цикл function calling.
   * @param {string} message
   * @param {number} userId
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async chat(message, userId) {
    console.log(`[OpenRouterAgent] Новый запрос userId=${userId}: "${message.substring(0, 80)}..."`);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: message },
    ];

    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const completion = await openRouterService.chatText(messages, TOOLS);
      const assistantMessage = openRouterService.extractMessage(completion);

      if (!assistantMessage) {
        throw new Error('Пустой ответ от OpenRouter');
      }

      // Добавляем сообщение ассистента в историю
      messages.push(assistantMessage);

      const toolCalls = assistantMessage.tool_calls || [];

      // Нет вызовов инструментов — финальный ответ
      if (toolCalls.length === 0) {
        const text = assistantMessage.content || '';
        console.log(`[OpenRouterAgent] Финальный ответ (${text.length} символов) за ${i + 1} итерацию`);
        return { success: true, message: text };
      }

      console.log(`[OpenRouterAgent] Итерация ${i + 1}: ${toolCalls.length} вызов(ов) инструментов`);

      // Выполняем все вызовы инструментов
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          args = {};
        }

        const result = await executeTool(toolName, args, userId);
        console.log(`[OpenRouterAgent] Результат ${toolName}:`, String(result).substring(0, 200));

        // Добавляем результат tool call в историю
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: String(result),
        });
      }
    }

    throw new Error('Превышено максимальное число итераций function calling');
  }

  /**
   * Проверка доступности OpenRouter API
   */
  async healthCheck() {
    try {
      const completion = await openRouterService.chatText([
        { role: 'user', content: 'Скажи "OK"' },
      ]);
      return !!openRouterService.extractText(completion);
    } catch (error) {
      console.error('[OpenRouterAgent] Health check failed:', error.message);
      return false;
    }
  }
}

export default new OpenRouterAgent();

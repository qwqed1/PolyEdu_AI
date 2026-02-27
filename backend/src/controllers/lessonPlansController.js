import { LessonPlanModel } from '../models/lessonPlans.js';
import openRouterService from '../services/openRouterService.js';

export const lessonPlansController = {
  /**
   * AI-генерация планов уроков через Gemma 3 27B
   */
  async generate(req, res) {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Промпт не передан' });
      }

      const totalMatch = prompt.match(/(\d+)\s*планов/);
      const totalLessons = totalMatch ? parseInt(totalMatch[1]) : 18;
      
      const BATCH_SIZE = 6;
      const batches = Math.ceil(totalLessons / BATCH_SIZE);
      let allPlans = [];

      console.log(`[LessonPlans] Генерация ${totalLessons} планов (${batches} батчей по ${BATCH_SIZE})`);

      for (let batch = 0; batch < batches; batch++) {
        const from = batch * BATCH_SIZE + 1;
        const to = Math.min((batch + 1) * BATCH_SIZE, totalLessons);

        const prevTopics = allPlans.map(p => `${p.lesson_number}. ${p.topic}`).join('\n');
        const contextNote = prevTopics 
          ? `\n\nУже сгенерированные темы (НЕ повторяй, продолжай логически):\n${prevTopics}` 
          : '';

        const batchPrompt = prompt
          .replace(/\d+\s*планов/, `${to - from + 1} планов (уроки с ${from} по ${to})`)
          + contextNote
          + `\n\nНумерация уроков: с ${from} по ${to}. Ответь ТОЛЬКО JSON массивом.`;

        const messages = [
          {
            role: 'system',
            content: 'Ты — AI-помощник для планов уроков. ОТВЕЧАЙ ТОЛЬКО JSON МАССИВОМ. Без markdown, без пояснений, без ```json. Только чистый JSON: [{...}]'
          },
          { role: 'user', content: batchPrompt }
        ];

        console.log(`[LessonPlans] Батч ${batch + 1}/${batches}: уроки ${from}-${to}`);

        const completion = await openRouterService.chatLesson(messages);
        let text = openRouterService.extractText(completion);

        // Парсим
        text = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*/g, '').trim();
        text = text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim();

        let plans = [];
        try { plans = JSON.parse(text); } catch {}
        
        if (!Array.isArray(plans) || plans.length === 0) {
          const s = text.indexOf('['), e = text.lastIndexOf(']');
          if (s !== -1 && e > s) { try { plans = JSON.parse(text.substring(s, e + 1)); } catch {} }
        }
        
        if (!Array.isArray(plans) || plans.length === 0) {
          const s = text.indexOf('[');
          if (s !== -1) {
            const t = text.substring(s), lo = t.lastIndexOf('}');
            if (lo > 0) { try { plans = JSON.parse(t.substring(0, lo + 1) + ']'); } catch {} }
          }
        }

        if (Array.isArray(plans) && plans.length > 0) {
          plans.forEach((p, i) => { p.lesson_number = from + i; });
          allPlans.push(...plans);
          console.log(`[LessonPlans] Батч ${batch + 1}: ${plans.length} планов (всего: ${allPlans.length})`);
        } else {
          console.warn(`[LessonPlans] Батч ${batch + 1}: не удалось распарсить`);
        }
      }

      if (allPlans.length === 0) {
        return res.status(422).json({ error: 'AI не вернул данные в нужном формате' });
      }

      console.log(`[LessonPlans] Итого: ${allPlans.length} планов`);
      res.json({ success: true, plans: allPlans });

    } catch (error) {
      console.error('[LessonPlans] Generate error:', error.message);
      res.status(500).json({ error: error.message || 'Ошибка генерации' });
    }
  },
  /**
   * Инициализация таблицы (вызывается при старте)
   */
  async initTable(req, res) {
    try {
      await LessonPlanModel.initTable();
      res.json({ success: true, message: 'Таблица lesson_plans создана' });
    } catch (error) {
      console.error('Init table error:', error);
      res.status(500).json({ error: 'Ошибка инициализации таблицы' });
    }
  },

  /**
   * Получить все планы уроков
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const plans = await LessonPlanModel.getAllByUserId(userId);
      res.json(plans);
    } catch (error) {
      console.error('Get all plans error:', error);
      res.status(500).json({ error: 'Ошибка получения планов' });
    }
  },

  /**
   * Получить планы по предмету
   */
  async getBySubject(req, res) {
    try {
      const userId = req.user.id;
      const { subjectName } = req.params;
      const plans = await LessonPlanModel.getBySubject(userId, decodeURIComponent(subjectName));
      res.json(plans);
    } catch (error) {
      console.error('Get plans by subject error:', error);
      res.status(500).json({ error: 'Ошибка получения планов по предмету' });
    }
  },

  /**
   * Получить план по ID
   */
  async getById(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const plan = await LessonPlanModel.getById(id, userId);
      if (!plan) {
        return res.status(404).json({ error: 'План не найден' });
      }
      res.json(plan);
    } catch (error) {
      console.error('Get plan by id error:', error);
      res.status(500).json({ error: 'Ошибка получения плана' });
    }
  },

  /**
   * Создать план урока
   */
  async create(req, res) {
    try {
      const userId = req.user.id;
      const plan = await LessonPlanModel.create(req.body, userId);
      res.status(201).json(plan);
    } catch (error) {
      console.error('Create plan error:', error);
      res.status(500).json({ error: 'Ошибка создания плана' });
    }
  },

  /**
   * Создать множество планов
   */
  async createMany(req, res) {
    try {
      const userId = req.user.id;
      const { plans } = req.body;
      if (!plans || !Array.isArray(plans)) {
        return res.status(400).json({ error: 'Передайте массив plans' });
      }
      const results = await LessonPlanModel.createMany(plans, userId);
      res.status(201).json({ success: true, created: results.length, plans: results });
    } catch (error) {
      console.error('Create many plans error:', error);
      res.status(500).json({ error: 'Ошибка создания планов' });
    }
  },

  /**
   * Обновить план урока
   */
  async update(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const plan = await LessonPlanModel.update(id, req.body, userId);
      if (!plan) {
        return res.status(404).json({ error: 'План не найден' });
      }
      res.json(plan);
    } catch (error) {
      console.error('Update plan error:', error);
      res.status(500).json({ error: 'Ошибка обновления плана' });
    }
  },

  /**
   * Удалить план урока
   */
  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await LessonPlanModel.delete(id, userId);
      if (!result) {
        return res.status(404).json({ error: 'План не найден' });
      }
      res.json({ success: true, message: 'План удалён' });
    } catch (error) {
      console.error('Delete plan error:', error);
      res.status(500).json({ error: 'Ошибка удаления плана' });
    }
  },

  /**
   * Удалить все планы по предмету
   */
  async deleteBySubject(req, res) {
    try {
      const userId = req.user.id;
      const { subjectName } = req.params;
      const results = await LessonPlanModel.deleteBySubject(decodeURIComponent(subjectName), userId);
      res.json({ success: true, deleted: results.length });
    } catch (error) {
      console.error('Delete plans by subject error:', error);
      res.status(500).json({ error: 'Ошибка удаления планов' });
    }
  }
};

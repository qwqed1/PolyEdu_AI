import { LessonPlanModel } from '../models/lessonPlans.js';

export const lessonPlansController = {
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

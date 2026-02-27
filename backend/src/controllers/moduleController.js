import { ModuleModel } from '../models/modules.js';

export const moduleController = {
  /**
   * Получить все модули группы
   * GET /api/groups/:groupId/modules
   */
  async getAllByGroup(req, res) {
    try {
      const { groupId } = req.params;
      const userId = req.user.id;

      const modules = await ModuleModel.getAllByGroupId(groupId, userId);

      if (modules === null) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }

      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('[Module Controller] Error getting modules:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении модулей'
      });
    }
  },

  /**
   * Создать модуль в группе
   * POST /api/groups/:groupId/modules
   */
  async create(req, res) {
    try {
      const { groupId } = req.params;
      const { code, name, module_type } = req.body;
      const userId = req.user.id;

      if (!code || !code.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Код модуля обязателен (например КМ1)'
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Название модуля обязательно'
        });
      }

      const moduleType = module_type || 'theory';
      if (!['theory', 'practice'].includes(moduleType)) {
        return res.status(400).json({
          success: false,
          error: 'Тип модуля должен быть theory или practice'
        });
      }

      // Проверяем принадлежность группы
      const { GroupModel } = await import('../models/groups.js');
      const group = await GroupModel.getById(groupId, userId);
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }

      const module = await ModuleModel.create(groupId, code.trim(), name.trim(), moduleType);

      res.status(201).json({
        success: true,
        data: module,
        message: 'Модуль успешно создан'
      });
    } catch (error) {
      console.error('[Module Controller] Error creating module:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании модуля'
      });
    }
  },

  /**
   * Обновить модуль
   * PUT /api/modules/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { code, name, module_type } = req.body;
      const userId = req.user.id;

      const isOwner = await ModuleModel.verifyOwnership(id, userId);
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          error: 'Модуль не найден'
        });
      }

      const module = await ModuleModel.update(id, code, name, module_type);

      res.json({
        success: true,
        data: module,
        message: 'Модуль успешно обновлён'
      });
    } catch (error) {
      console.error('[Module Controller] Error updating module:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении модуля'
      });
    }
  },

  /**
   * Удалить модуль
   * DELETE /api/modules/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const isOwner = await ModuleModel.verifyOwnership(id, userId);
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          error: 'Модуль не найден'
        });
      }

      await ModuleModel.delete(id);

      res.json({
        success: true,
        message: 'Модуль успешно удалён'
      });
    } catch (error) {
      console.error('[Module Controller] Error deleting module:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении модуля'
      });
    }
  },

  /**
   * Добавить предмет в модуль
   * POST /api/modules/:moduleId/subjects
   */
  async addSubject(req, res) {
    try {
      const { moduleId } = req.params;
      const { code, name } = req.body;
      const userId = req.user.id;

      if (!code || !code.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Код предмета обязателен (например ОН1.1)'
        });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Название предмета обязательно'
        });
      }

      const isOwner = await ModuleModel.verifyOwnership(moduleId, userId);
      if (!isOwner) {
        return res.status(404).json({
          success: false,
          error: 'Модуль не найден'
        });
      }

      const subject = await ModuleModel.addSubject(moduleId, code.trim(), name.trim());

      res.status(201).json({
        success: true,
        data: subject,
        message: 'Предмет добавлен в модуль'
      });
    } catch (error) {
      console.error('[Module Controller] Error adding subject:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при добавлении предмета'
      });
    }
  },

  /**
   * Удалить предмет из модуля
   * DELETE /api/module-subjects/:id
   */
  async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Проверяем принадлежность через модуль
      const subjectCheck = await (await import('../config/db.js')).default.query(
        `SELECT ms.id FROM module_subjects ms
         JOIN modules m ON m.id = ms.module_id
         JOIN groups g ON g.id = m.group_id
         WHERE ms.id = $1 AND g.user_id = $2`,
        [id, userId]
      );

      if (subjectCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Предмет не найден'
        });
      }

      await ModuleModel.deleteSubject(id);

      res.json({
        success: true,
        message: 'Предмет удалён из модуля'
      });
    } catch (error) {
      console.error('[Module Controller] Error deleting subject:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении предмета'
      });
    }
  }
};

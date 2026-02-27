import { GroupModel } from '../models/groups.js';

export const groupController = {
  /**
   * Получить все группы пользователя
   * GET /api/groups
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const groups = await GroupModel.getAllByUserId(userId);
      
      res.json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('[Group Controller] Error getting groups:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении групп'
      });
    }
  },

  /**
   * Получить группу по ID
   * GET /api/groups/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const group = await GroupModel.getById(id, userId);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }
      
      res.json({
        success: true,
        data: group
      });
    } catch (error) {
      console.error('[Group Controller] Error getting group:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении группы'
      });
    }
  },

  /**
   * Создать группу
   * POST /api/groups
   */
  async create(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Название группы обязательно'
        });
      }
      
      const group = await GroupModel.create(name.trim(), userId);
      
      res.status(201).json({
        success: true,
        data: group,
        message: 'Группа успешно создана'
      });
    } catch (error) {
      console.error('[Group Controller] Error creating group:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании группы'
      });
    }
  },

  /**
   * Обновить группу
   * PUT /api/groups/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const userId = req.user.id;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Название группы обязательно'
        });
      }
      
      const group = await GroupModel.update(id, name.trim(), userId);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }
      
      res.json({
        success: true,
        data: group,
        message: 'Группа успешно обновлена'
      });
    } catch (error) {
      console.error('[Group Controller] Error updating group:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при обновлении группы'
      });
    }
  },

  /**
   * Удалить группу
   * DELETE /api/groups/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const group = await GroupModel.delete(id, userId);
      
      if (!group) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }
      
      res.json({
        success: true,
        message: 'Группа успешно удалена'
      });
    } catch (error) {
      console.error('[Group Controller] Error deleting group:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении группы'
      });
    }
  },

  /**
   * Получить статистику группы
   * GET /api/groups/:id/stats
   */
  async getStats(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const stats = await GroupModel.getStats(id, userId);
      
      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Группа не найдена'
        });
      }
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Group Controller] Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  }
};

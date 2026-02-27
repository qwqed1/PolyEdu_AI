import { SubjectModel } from '../models/subjects.js';

export const subjectController = {
  /**
   * Получить все предметы пользователя
   * GET /api/subjects
   */
  async getAll(req, res) {
    try {
      const userId = req.user.id;
      const subjects = await SubjectModel.getAllByUserId(userId);
      
      res.json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('[Subject Controller] Error getting subjects:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении предметов'
      });
    }
  },

  /**
   * Создать предмет
   * POST /api/subjects
   */
  async create(req, res) {
    try {
      const { name } = req.body;
      const userId = req.user.id;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Название предмета обязательно'
        });
      }
      
      const subject = await SubjectModel.create(name.trim(), userId);
      
      res.status(201).json({
        success: true,
        data: subject,
        message: 'Предмет успешно создан'
      });
    } catch (error) {
      console.error('[Subject Controller] Error creating subject:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при создании предмета'
      });
    }
  },

  /**
   * Удалить предмет
   * DELETE /api/subjects/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const subject = await SubjectModel.delete(id, userId);
      
      if (!subject) {
        return res.status(404).json({
          success: false,
          error: 'Предмет не найден'
        });
      }
      
      res.json({
        success: true,
        message: 'Предмет успешно удален'
      });
    } catch (error) {
      console.error('[Subject Controller] Error deleting subject:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении предмета'
      });
    }
  }
};

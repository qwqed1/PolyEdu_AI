import { StudentModel } from '../models/students.js';

export const studentController = {
  /**
   * Получить всех студентов группы
   * GET /api/students?groupId=X
   */
  async getAll(req, res) {
    try {
      const { groupId } = req.query;
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          error: 'groupId обязателен'
        });
      }
      
      const students = await StudentModel.getAllByGroupId(groupId);
      
      res.json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('[Student Controller] Error getting students:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении студентов'
      });
    }
  },

  /**
   * Создать студента
   * POST /api/students
   */
  async create(req, res) {
    try {
      const { fullName, groupId } = req.body;
      
      if (!fullName || fullName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'ФИО студента обязательно'
        });
      }
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          error: 'ID группы обязателен'
        });
      }
      
      const student = await StudentModel.create(fullName.trim(), groupId);
      
      res.status(201).json({
        success: true,
        data: student,
        message: 'Студент успешно добавлен'
      });
    } catch (error) {
      console.error('[Student Controller] Error creating student:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при добавлении студента'
      });
    }
  },

  /**
   * Удалить студента
   * DELETE /api/students/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const student = await StudentModel.delete(id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'Студент не найден'
        });
      }
      
      res.json({
        success: true,
        message: 'Студент успешно удален'
      });
    } catch (error) {
      console.error('[Student Controller] Error deleting student:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении студента'
      });
    }
  }
};

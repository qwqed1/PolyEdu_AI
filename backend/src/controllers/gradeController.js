import { GradeModel } from '../models/grades.js';

export const gradeController = {
  /**
   * Получить оценки студента
   * GET /api/grades?studentId=X
   */
  async getAll(req, res) {
    try {
      const { studentId } = req.query;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'studentId обязателен'
        });
      }
      
      const grades = await GradeModel.getAllByStudentId(studentId);
      
      res.json({
        success: true,
        data: grades
      });
    } catch (error) {
      console.error('[Grade Controller] Error getting grades:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении оценок'
      });
    }
  },

  /**
   * Создать оценку
   * POST /api/grades
   */
  async create(req, res) {
    try {
      const { studentId, subjectId, grade, topic, date } = req.body;
      
      if (!studentId || !subjectId || grade === undefined) {
        return res.status(400).json({
          success: false,
          error: 'studentId, subjectId и grade обязательны'
        });
      }
      
      if (grade < 0 || grade > 100) {
        return res.status(400).json({
          success: false,
          error: 'Оценка должна быть от 0 до 100'
        });
      }
      
      const newGrade = await GradeModel.create(studentId, subjectId, grade, topic, date);
      
      res.status(201).json({
        success: true,
        data: newGrade,
        message: 'Оценка успешно добавлена'
      });
    } catch (error) {
      console.error('[Grade Controller] Error creating grade:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при добавлении оценки'
      });
    }
  },

  /**
   * Удалить оценку
   * DELETE /api/grades/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const grade = await GradeModel.delete(id);
      
      if (!grade) {
        return res.status(404).json({
          success: false,
          error: 'Оценка не найдена'
        });
      }
      
      res.json({
        success: true,
        message: 'Оценка успешно удалена'
      });
    } catch (error) {
      console.error('[Grade Controller] Error deleting grade:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при удалении оценки'
      });
    }
  }
};

import pool from '../config/db.js';

export const GradeModel = {
  /**
   * Получить все оценки студента
   */
  async getAllByStudentId(studentId) {
    const result = await pool.query(
      `SELECT 
        gr.id,
        gr.grade,
        gr.topic,
        gr.date,
        sub.name as subject_name,
        sub.id as subject_id
       FROM grades gr
       JOIN subjects sub ON sub.id = gr.subject_id
       WHERE gr.student_id = $1
       ORDER BY gr.date DESC`,
      [studentId]
    );
    return result.rows;
  },

  /**
   * Создать оценку
   */
  async create(studentId, subjectId, grade, topic, date) {
    const result = await pool.query(
      `INSERT INTO grades (student_id, subject_id, grade, topic, date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, student_id, subject_id, grade, topic, date, created_at`,
      [studentId, subjectId, grade, topic, date || new Date()]
    );
    return result.rows[0];
  },

  /**
   * Обновить оценку
   */
  async update(id, grade, topic) {
    const result = await pool.query(
      `UPDATE grades 
       SET grade = $1, topic = $2
       WHERE id = $3
       RETURNING id, student_id, subject_id, grade, topic, date`,
      [grade, topic, id]
    );
    return result.rows[0];
  },

  /**
   * Удалить оценку
   */
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM grades WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Получить средний балл группы
   */
  async getGroupAverage(groupId) {
    const result = await pool.query(
      `SELECT 
        ROUND(AVG(gr.grade)::numeric, 2) as average_grade,
        COUNT(gr.id) as total_grades,
        MIN(gr.grade) as min_grade,
        MAX(gr.grade) as max_grade
       FROM grades gr
       JOIN students s ON s.id = gr.student_id
       WHERE s.group_id = $1`,
      [groupId]
    );
    return result.rows[0];
  },

  /**
   * Получить средний балл студента
   */
  async getStudentAverage(studentId) {
    const result = await pool.query(
      `SELECT 
        ROUND(AVG(grade)::numeric, 2) as average_grade,
        COUNT(id) as total_grades
       FROM grades
       WHERE student_id = $1`,
      [studentId]
    );
    return result.rows[0];
  }
};

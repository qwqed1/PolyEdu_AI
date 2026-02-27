import pool from '../config/db.js';

export const StudentModel = {
  /**
   * Получить всех студентов группы
   */
  async getAllByGroupId(groupId) {
    const result = await pool.query(
      `SELECT 
        s.id, 
        s.full_name, 
        s.created_at,
        ROUND(AVG(gr.grade)::numeric, 2) as average_grade,
        COUNT(gr.id) as total_grades
       FROM students s
       LEFT JOIN grades gr ON gr.student_id = s.id
       WHERE s.group_id = $1
       GROUP BY s.id, s.full_name, s.created_at
       ORDER BY s.full_name`,
      [groupId]
    );
    return result.rows;
  },

  /**
   * Получить студента по ID
   */
  async getById(id) {
    const result = await pool.query(
      `SELECT 
        s.id, 
        s.full_name, 
        s.group_id,
        s.created_at,
        g.name as group_name
       FROM students s
       JOIN groups g ON g.id = s.group_id
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  /**
   * Создать студента
   */
  async create(fullName, groupId) {
    const result = await pool.query(
      `INSERT INTO students (full_name, group_id) 
       VALUES ($1, $2) 
       RETURNING id, full_name, group_id, created_at`,
      [fullName, groupId]
    );
    return result.rows[0];
  },

  /**
   * Обновить студента
   */
  async update(id, fullName) {
    const result = await pool.query(
      `UPDATE students 
       SET full_name = $1 
       WHERE id = $2
       RETURNING id, full_name, group_id, created_at`,
      [fullName, id]
    );
    return result.rows[0];
  },

  /**
   * Удалить студента
   */
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Получить оценки студента
   */
  async getGrades(studentId) {
    const result = await pool.query(
      `SELECT 
        gr.id,
        gr.grade,
        gr.topic,
        gr.date,
        sub.name as subject_name
       FROM grades gr
       JOIN subjects sub ON sub.id = gr.subject_id
       WHERE gr.student_id = $1
       ORDER BY gr.date DESC`,
      [studentId]
    );
    return result.rows;
  }
};

import pool from '../config/db.js';

export const GroupModel = {
  /**
   * Получить все группы пользователя
   */
  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT 
        g.id, 
        g.name, 
        g.created_at,
        COUNT(DISTINCT s.id) as student_count
       FROM groups g
       LEFT JOIN students s ON s.group_id = g.id
       WHERE g.user_id = $1
       GROUP BY g.id, g.name, g.created_at
       ORDER BY g.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить группу по ID
   */
  async getById(id, userId) {
    const result = await pool.query(
      `SELECT 
        g.id, 
        g.name, 
        g.created_at,
        g.user_id
       FROM groups g
       WHERE g.id = $1 AND g.user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Создать группу
   */
  async create(name, userId) {
    const result = await pool.query(
      `INSERT INTO groups (name, user_id) 
       VALUES ($1, $2) 
       RETURNING id, name, created_at`,
      [name, userId]
    );
    return result.rows[0];
  },

  /**
   * Обновить группу
   */
  async update(id, name, userId) {
    const result = await pool.query(
      `UPDATE groups 
       SET name = $1 
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, created_at`,
      [name, id, userId]
    );
    return result.rows[0];
  },

  /**
   * Удалить группу
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM groups WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Получить статистику группы
   */
  async getStats(id, userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(gr.id) as total_grades,
        ROUND(AVG(gr.grade)::numeric, 2) as average_grade,
        MIN(gr.grade) as min_grade,
        MAX(gr.grade) as max_grade
       FROM groups g
       LEFT JOIN students s ON s.group_id = g.id
       LEFT JOIN grades gr ON gr.student_id = s.id
       WHERE g.id = $1 AND g.user_id = $2
       GROUP BY g.id`,
      [id, userId]
    );
    return result.rows[0];
  }
};

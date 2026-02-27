import pool from '../config/db.js';

export const SubjectModel = {
  /**
   * Получить все предметы пользователя
   */
  async getAllByUserId(userId) {
    const result = await pool.query(
      'SELECT id, name, created_at FROM subjects WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    return result.rows;
  },

  /**
   * Создать предмет
   */
  async create(name, userId) {
    const result = await pool.query(
      `INSERT INTO subjects (name, user_id) 
       VALUES ($1, $2) 
       RETURNING id, name, created_at`,
      [name, userId]
    );
    return result.rows[0];
  },

  /**
   * Удалить предмет
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM subjects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }
};

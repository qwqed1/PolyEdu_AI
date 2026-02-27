import pool from '../config/db.js';

export const AIGameModel = {
  /**
   * Инициализация таблицы
   */
  async initTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        html_code TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ai_games_user_id ON ai_games(user_id)');
  },

  /**
   * Получить все игры пользователя
   */
  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT id, title, prompt, created_at
       FROM ai_games
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить игру по ID
   */
  async getById(id, userId) {
    const result = await pool.query(
      `SELECT id, title, prompt, html_code, created_at
       FROM ai_games
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Сохранить игру
   */
  async create(userId, title, prompt, htmlCode) {
    const result = await pool.query(
      `INSERT INTO ai_games (user_id, title, prompt, html_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, prompt, created_at`,
      [userId, title, prompt, htmlCode]
    );
    return result.rows[0];
  },

  /**
   * Удалить игру
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM ai_games WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  }
};

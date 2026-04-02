import pool from '../config/db.js';

export const GameResultModel = {
  /**
   * Инициализация таблицы game_results
   */
  async initTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        player_name VARCHAR(255) NOT NULL,
        score INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        answers JSONB DEFAULT '[]'::jsonb,
        time_spent INTEGER DEFAULT 0,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
  },

  /**
   * Сохранить результат игры
   */
  async create(resultData) {
    const {
      quiz_id,
      player_name,
      score,
      correct_answers,
      total_questions,
      answers = [],
      time_spent
    } = resultData;

    const result = await pool.query(
      `INSERT INTO game_results (
        quiz_id, player_name, score, correct_answers, total_questions, answers, time_spent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        quiz_id,
        player_name,
        score,
        correct_answers,
        total_questions,
        JSON.stringify(answers),
        time_spent
      ]
    );
    return result.rows[0];
  },

  /**
   * Получить результаты квиза
   */
  async getByQuizId(quizId) {
    const result = await pool.query(
      `SELECT * FROM game_results 
       WHERE quiz_id = $1 
       ORDER BY score DESC, time_spent ASC`,
      [quizId]
    );
    return result.rows;
  },

  /**
   * Получить статистику квиза
   */
  async getQuizStats(quizId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_players,
        AVG(score) as avg_score,
        MAX(score) as max_score,
        AVG(correct_answers::float / NULLIF(total_questions, 0) * 100) as avg_accuracy,
        AVG(time_spent) as avg_time
       FROM game_results
       WHERE quiz_id = $1`,
      [quizId]
    );
    return result.rows[0];
  },

  /**
   * Получить топ игроков квиза
   */
  /**
   * Удалить все результаты квиза
   */
  async deleteByQuizId(quizId) {
    const result = await pool.query(
      'DELETE FROM game_results WHERE quiz_id = $1',
      [quizId]
    );
    return result.rowCount;
  }
};

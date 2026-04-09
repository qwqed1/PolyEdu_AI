import pool from '../config/db.js';

export const AIGameModel = {
  async initTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_games (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        source_lesson_plan_id INTEGER REFERENCES lesson_plans(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        html_code TEXT NOT NULL,
        is_public BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      ALTER TABLE ai_games
      ADD COLUMN IF NOT EXISTS source_lesson_plan_id INTEGER REFERENCES lesson_plans(id) ON DELETE SET NULL
    `);
    await pool.query(`
      ALTER TABLE ai_games
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE ai_games
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_games_user_id ON ai_games(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_games_publication ON ai_games(is_public, published_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_games_source_lesson_plan_id ON ai_games(source_lesson_plan_id)
    `);
  },

  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT
         g.id,
         g.title,
         g.prompt,
         g.is_public,
         g.published_at,
         g.created_at,
         g.source_lesson_plan_id,
         lp.topic AS source_lesson_topic
       FROM ai_games g
       LEFT JOIN lesson_plans lp ON g.source_lesson_plan_id = lp.id
       WHERE g.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getById(id, userId) {
    const result = await pool.query(
      `SELECT
         g.id,
         g.title,
         g.prompt,
         g.html_code,
         g.is_public,
         g.published_at,
         g.created_at,
         g.source_lesson_plan_id,
         lp.topic AS source_lesson_topic
       FROM ai_games g
       LEFT JOIN lesson_plans lp ON g.source_lesson_plan_id = lp.id
       WHERE g.id = $1 AND g.user_id = $2`,
      [id, userId]
    );
    return result.rows[0];
  },

  async getPublicById(id) {
    const result = await pool.query(
      `SELECT
         g.id,
         g.title,
         g.prompt,
         g.html_code,
         g.published_at,
         g.created_at,
         g.source_lesson_plan_id,
         lp.topic AS source_lesson_topic
       FROM ai_games g
       LEFT JOIN lesson_plans lp ON g.source_lesson_plan_id = lp.id
       WHERE g.id = $1 AND g.is_public = true`,
      [id]
    );
    return result.rows[0];
  },

  async create(userId, title, prompt, htmlCode, options = {}) {
    const {
      source_lesson_plan_id = null,
      is_public = false,
      published_at = null,
    } = options;

    const result = await pool.query(
      `INSERT INTO ai_games (
        user_id,
        source_lesson_plan_id,
        title,
        prompt,
        html_code,
        is_public,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, prompt, is_public, published_at, created_at, source_lesson_plan_id`,
      [
        userId,
        source_lesson_plan_id === '' ? null : source_lesson_plan_id,
        title,
        prompt,
        htmlCode,
        Boolean(is_public),
        published_at,
      ]
    );
    return result.rows[0];
  },

  async publish(id, userId, isPublic) {
    const result = await pool.query(
      `UPDATE ai_games
       SET
         is_public = $1,
         published_at = CASE
           WHEN $1 = true AND published_at IS NULL THEN NOW()
           WHEN $1 = false THEN NULL
           ELSE published_at
         END
       WHERE id = $2 AND user_id = $3
       RETURNING id, title, prompt, is_public, published_at, created_at, source_lesson_plan_id`,
      [isPublic, id, userId]
    );
    return result.rows[0];
  },

  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM ai_games WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },
};

import pool from '../config/db.js';

export const QuizModel = {
  async initTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'kahoot',
        subject_id INTEGER,
        group_id INTEGER,
        source_lesson_plan_id INTEGER REFERENCES lesson_plans(id) ON DELETE SET NULL,
        questions JSONB DEFAULT '[]'::jsonb,
        settings JSONB DEFAULT '{
          "timePerQuestion": 30,
          "shuffleQuestions": false,
          "shuffleAnswers": false,
          "showCorrectAnswers": true,
          "pointsPerQuestion": 100
        }'::jsonb,
        is_active BOOLEAN DEFAULT false,
        game_code VARCHAR(10),
        is_public BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE quizzes
      ADD COLUMN IF NOT EXISTS source_lesson_plan_id INTEGER REFERENCES lesson_plans(id) ON DELETE SET NULL
    `);
    await pool.query(`
      ALTER TABLE quizzes
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE quizzes
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_publication
      ON quizzes(is_public, published_at DESC)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_quizzes_source_lesson_plan_id
      ON quizzes(source_lesson_plan_id)
    `);
  },

  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT
         q.*,
         s.name AS subject_name,
         g.name AS group_name,
         lp.topic AS source_lesson_topic,
         jsonb_array_length(q.questions) AS questions_count
       FROM quizzes q
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN groups g ON q.group_id = g.id
       LEFT JOIN lesson_plans lp ON q.source_lesson_plan_id = lp.id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getById(id, userId = null) {
    let query = `
      SELECT
        q.*,
        s.name AS subject_name,
        g.name AS group_name,
        lp.topic AS source_lesson_topic
      FROM quizzes q
      LEFT JOIN subjects s ON q.subject_id = s.id
      LEFT JOIN groups g ON q.group_id = g.id
      LEFT JOIN lesson_plans lp ON q.source_lesson_plan_id = lp.id
      WHERE q.id = $1
    `;
    const params = [id];

    if (userId) {
      query += ' AND q.user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  },

  async getPublicById(id) {
    const result = await pool.query(
      `SELECT
         q.*,
         s.name AS subject_name,
         g.name AS group_name,
         lp.topic AS source_lesson_topic
       FROM quizzes q
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN groups g ON q.group_id = g.id
       LEFT JOIN lesson_plans lp ON q.source_lesson_plan_id = lp.id
       WHERE q.id = $1 AND q.is_public = true`,
      [id]
    );
    return result.rows[0];
  },

  async create(quizData, userId) {
    const {
      title,
      description,
      type = 'kahoot',
      subject_id,
      group_id,
      source_lesson_plan_id,
      questions = [],
      settings = {},
      is_public = false,
      published_at = null,
    } = quizData;

    const defaultSettings = {
      timePerQuestion: 30,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      pointsPerQuestion: 100,
    };

    const mergedSettings = { ...defaultSettings, ...settings };
    const subjectIdValue = subject_id === '' || subject_id === undefined ? null : subject_id;
    const groupIdValue = group_id === '' || group_id === undefined ? null : group_id;
    const sourceLessonPlanIdValue =
      source_lesson_plan_id === '' || source_lesson_plan_id === undefined
        ? null
        : source_lesson_plan_id;

    const result = await pool.query(
      `INSERT INTO quizzes (
        user_id,
        title,
        description,
        type,
        subject_id,
        group_id,
        source_lesson_plan_id,
        questions,
        settings,
        is_public,
        published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        userId,
        title,
        description || null,
        type,
        subjectIdValue,
        groupIdValue,
        sourceLessonPlanIdValue,
        JSON.stringify(questions),
        JSON.stringify(mergedSettings),
        Boolean(is_public),
        published_at,
      ]
    );
    return result.rows[0];
  },

  async update(id, quizData, userId) {
    const {
      title,
      description,
      type,
      subject_id,
      group_id,
      source_lesson_plan_id,
      questions,
      settings,
      is_public,
      published_at,
    } = quizData;

    const subjectIdValue = subject_id === '' || subject_id === undefined ? null : subject_id;
    const groupIdValue = group_id === '' || group_id === undefined ? null : group_id;
    const sourceLessonPlanIdValue =
      source_lesson_plan_id === '' || source_lesson_plan_id === undefined
        ? null
        : source_lesson_plan_id;

    const result = await pool.query(
      `UPDATE quizzes SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        subject_id = COALESCE($4, subject_id),
        group_id = COALESCE($5, group_id),
        source_lesson_plan_id = COALESCE($6, source_lesson_plan_id),
        questions = COALESCE($7, questions),
        settings = COALESCE($8, settings),
        is_public = COALESCE($9, is_public),
        published_at = COALESCE($10, published_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11 AND user_id = $12
      RETURNING *`,
      [
        title,
        description,
        type,
        subjectIdValue,
        groupIdValue,
        sourceLessonPlanIdValue,
        questions ? JSON.stringify(questions) : null,
        settings ? JSON.stringify(settings) : null,
        typeof is_public === 'boolean' ? is_public : null,
        published_at ?? null,
        id,
        userId,
      ]
    );
    return result.rows[0];
  },

  async publish(id, userId, isPublic) {
    const result = await pool.query(
      `UPDATE quizzes
       SET
         is_public = $1,
         published_at = CASE
           WHEN $1 = true AND published_at IS NULL THEN NOW()
           WHEN $1 = false THEN NULL
           ELSE published_at
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [isPublic, id, userId]
    );
    return result.rows[0];
  },

  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  async addQuestion(id, question, userId) {
    const result = await pool.query(
      `UPDATE quizzes SET
        questions = questions || $1::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING *`,
      [JSON.stringify([question]), id, userId]
    );
    return result.rows[0];
  },

  async getStats(userId) {
    const result = await pool.query(
      `SELECT
         COUNT(*) AS total_quizzes,
         SUM(jsonb_array_length(questions)) AS total_questions
       FROM quizzes
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  },
};

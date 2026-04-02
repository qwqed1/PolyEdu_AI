import pool from '../config/db.js';

export const QuizModel = {
  /**
   * Инициализация таблицы quizzes
   */
  async initTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) DEFAULT 'kahoot',
        subject_id INTEGER,
        group_id INTEGER,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
  },

  /**
   * Получить все квизы пользователя
   */
  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT q.*, s.name as subject_name, g.name as group_name,
              jsonb_array_length(q.questions) as questions_count
       FROM quizzes q
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN groups g ON q.group_id = g.id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить квиз по ID
   */
  async getById(id, userId = null) {
    let query = `
      SELECT q.*, s.name as subject_name, g.name as group_name
       FROM quizzes q
       LEFT JOIN subjects s ON q.subject_id = s.id
       LEFT JOIN groups g ON q.group_id = g.id
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

  /**
   * Получить квиз по игровому коду
   */
  /**
   * Создать квиз
   */
  async create(quizData, userId) {
    const {
      title,
      description,
      type = 'kahoot',
      subject_id,
      group_id,
      questions = [],
      settings = {}
    } = quizData;

    const defaultSettings = {
      timePerQuestion: 30,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      pointsPerQuestion: 100
    };

    const mergedSettings = { ...defaultSettings, ...settings };

    // Преобразуем пустые строки в null
    const subjectIdValue = subject_id === '' || subject_id === undefined ? null : subject_id;
    const groupIdValue = group_id === '' || group_id === undefined ? null : group_id;

    const result = await pool.query(
      `INSERT INTO quizzes (
        user_id, title, description, type, subject_id, group_id, questions, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        userId,
        title,
        description || null,
        type,
        subjectIdValue,
        groupIdValue,
        JSON.stringify(questions),
        JSON.stringify(mergedSettings)
      ]
    );
    return result.rows[0];
  },

  /**
   * Обновить квиз
   */
  async update(id, quizData, userId) {
    const {
      title,
      description,
      type,
      subject_id,
      group_id,
      questions,
      settings
    } = quizData;

    const result = await pool.query(
      `UPDATE quizzes SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        type = COALESCE($3, type),
        subject_id = COALESCE($4, subject_id),
        group_id = COALESCE($5, group_id),
        questions = COALESCE($6, questions),
        settings = COALESCE($7, settings),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND user_id = $9
      RETURNING *`,
      [
        title,
        description,
        type,
        subject_id,
        group_id,
        questions ? JSON.stringify(questions) : null,
        settings ? JSON.stringify(settings) : null,
        id,
        userId
      ]
    );
    return result.rows[0];
  },

  /**
   * Удалить квиз
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM quizzes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Активировать квиз и сгенерировать игровой код
   */
  /**
   * Добавить вопрос к квизу
   */
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

  /**
   * Получить все активные квизы (для студентов)
   */
  /**
   * Получить статистику квизов пользователя
   */
  async getStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_quizzes,
        SUM(jsonb_array_length(questions)) as total_questions
       FROM quizzes
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }
};

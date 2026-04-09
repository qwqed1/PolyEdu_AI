import pool from '../config/db.js';

export const LessonPlanModel = {
  async initTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        subject_name VARCHAR(255) NOT NULL,
        module_code VARCHAR(100),
        group_name VARCHAR(100),
        course INTEGER,
        lesson_number INTEGER,
        topic VARCHAR(500),
        lesson_date DATE,
        lesson_type VARCHAR(100),
        teacher_name VARCHAR(255),
        goals TEXT,
        objectives TEXT,
        expected_results TEXT,
        resources_methods TEXT,
        resources_technical TEXT,
        stage_organization TEXT,
        stage_knowledge TEXT,
        stage_new_skills TEXT,
        stage_consolidation TEXT,
        stage_assessment TEXT,
        stage_homework TEXT,
        stage_reflection TEXT,
        semester_hours INTEGER,
        is_public BOOLEAN NOT NULL DEFAULT false,
        published_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE lesson_plans
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false
    `);
    await pool.query(`
      ALTER TABLE lesson_plans
      ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_plans_user_id ON lesson_plans(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_lesson_plans_publication
      ON lesson_plans(is_public, published_at DESC)
    `);
  },

  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT *
       FROM lesson_plans
       WHERE user_id = $1
       ORDER BY subject_name ASC NULLS LAST, lesson_number ASC NULLS LAST, created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async getBySubject(userId, subjectName) {
    const result = await pool.query(
      `SELECT *
       FROM lesson_plans
       WHERE user_id = $1 AND subject_name = $2
       ORDER BY lesson_number ASC NULLS LAST, created_at DESC`,
      [userId, subjectName]
    );
    return result.rows;
  },

  async getById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM lesson_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  async getPublicById(id) {
    const result = await pool.query(
      `SELECT *
       FROM lesson_plans
       WHERE id = $1 AND is_public = true`,
      [id]
    );
    return result.rows[0];
  },

  async getPublicRelatedMaterials(id) {
    const [quizzesResult, gamesResult] = await Promise.all([
      pool.query(
        `SELECT
          id,
          title,
          description,
          type,
          published_at,
          created_at,
          jsonb_array_length(questions) AS questions_count
         FROM quizzes
         WHERE source_lesson_plan_id = $1 AND is_public = true
         ORDER BY published_at DESC NULLS LAST, created_at DESC`,
        [id]
      ),
      pool.query(
        `SELECT
          id,
          title,
          prompt,
          published_at,
          created_at
         FROM ai_games
         WHERE source_lesson_plan_id = $1 AND is_public = true
         ORDER BY published_at DESC NULLS LAST, created_at DESC`,
        [id]
      ),
    ]);

    return {
      quizzes: quizzesResult.rows,
      games: gamesResult.rows,
    };
  },

  async create(planData, userId) {
    const {
      subject_name,
      module_code,
      group_name,
      course,
      lesson_number,
      topic,
      lesson_date,
      lesson_type,
      teacher_name,
      goals,
      objectives,
      expected_results,
      resources_methods,
      resources_technical,
      stage_organization,
      stage_knowledge,
      stage_new_skills,
      stage_consolidation,
      stage_assessment,
      stage_homework,
      stage_reflection,
      semester_hours,
      is_public = false,
      published_at = null,
    } = planData;

    const result = await pool.query(
      `INSERT INTO lesson_plans (
        user_id, subject_name, module_code, group_name, course, lesson_number,
        topic, lesson_date, lesson_type, teacher_name, goals, objectives,
        expected_results, resources_methods, resources_technical,
        stage_organization, stage_knowledge, stage_new_skills,
        stage_consolidation, stage_assessment, stage_homework,
        stage_reflection, semester_hours, is_public, published_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25
      )
      RETURNING *`,
      [
        userId,
        subject_name,
        module_code,
        group_name,
        course,
        lesson_number,
        topic,
        lesson_date,
        lesson_type,
        teacher_name,
        goals,
        objectives,
        expected_results,
        resources_methods,
        resources_technical,
        stage_organization,
        stage_knowledge,
        stage_new_skills,
        stage_consolidation,
        stage_assessment,
        stage_homework,
        stage_reflection,
        semester_hours,
        Boolean(is_public),
        published_at,
      ]
    );
    return result.rows[0];
  },

  async update(id, planData, userId) {
    const {
      subject_name,
      module_code,
      group_name,
      course,
      lesson_number,
      topic,
      lesson_date,
      lesson_type,
      teacher_name,
      goals,
      objectives,
      expected_results,
      resources_methods,
      resources_technical,
      stage_organization,
      stage_knowledge,
      stage_new_skills,
      stage_consolidation,
      stage_assessment,
      stage_homework,
      stage_reflection,
      semester_hours,
      is_public,
      published_at,
    } = planData;

    const result = await pool.query(
      `UPDATE lesson_plans SET
        subject_name = $1,
        module_code = $2,
        group_name = $3,
        course = $4,
        lesson_number = $5,
        topic = $6,
        lesson_date = $7,
        lesson_type = $8,
        teacher_name = $9,
        goals = $10,
        objectives = $11,
        expected_results = $12,
        resources_methods = $13,
        resources_technical = $14,
        stage_organization = $15,
        stage_knowledge = $16,
        stage_new_skills = $17,
        stage_consolidation = $18,
        stage_assessment = $19,
        stage_homework = $20,
        stage_reflection = $21,
        semester_hours = $22,
        is_public = COALESCE($23, is_public),
        published_at = COALESCE($24, published_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $25 AND user_id = $26
      RETURNING *`,
      [
        subject_name,
        module_code,
        group_name,
        course,
        lesson_number,
        topic,
        lesson_date,
        lesson_type,
        teacher_name,
        goals,
        objectives,
        expected_results,
        resources_methods,
        resources_technical,
        stage_organization,
        stage_knowledge,
        stage_new_skills,
        stage_consolidation,
        stage_assessment,
        stage_homework,
        stage_reflection,
        semester_hours,
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
      `UPDATE lesson_plans
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
      'DELETE FROM lesson_plans WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  async deleteBySubject(subjectName, userId) {
    const result = await pool.query(
      'DELETE FROM lesson_plans WHERE subject_name = $1 AND user_id = $2 RETURNING id',
      [subjectName, userId]
    );
    return result.rows;
  },

  async createMany(plans, userId) {
    const results = [];
    for (const plan of plans) {
      const result = await this.create(plan, userId);
      results.push(result);
    }
    return results;
  },
};

import pool from '../config/db.js';

export const LessonPlanModel = {
  /**
   * Инициализация таблицы lesson_plans
   */
  async initTable() {
    const query = `
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
  },

  /**
   * Получить все планы уроков пользователя
   */
  async getAllByUserId(userId) {
    const result = await pool.query(
      `SELECT * FROM lesson_plans 
       WHERE user_id = $1 
       ORDER BY lesson_number ASC`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить планы по предмету
   */
  async getBySubject(userId, subjectName) {
    const result = await pool.query(
      `SELECT * FROM lesson_plans 
       WHERE user_id = $1 AND subject_name = $2 
       ORDER BY lesson_number ASC`,
      [userId, subjectName]
    );
    return result.rows;
  },

  /**
   * Получить план по ID
   */
  async getById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM lesson_plans WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Создать план урока
   */
  async create(planData, userId) {
    const {
      subject_name, module_code, group_name, course, lesson_number,
      topic, lesson_date, lesson_type, teacher_name, goals, objectives,
      expected_results, resources_methods, resources_technical,
      stage_organization, stage_knowledge, stage_new_skills,
      stage_consolidation, stage_assessment, stage_homework,
      stage_reflection, semester_hours
    } = planData;

    const result = await pool.query(
      `INSERT INTO lesson_plans (
        user_id, subject_name, module_code, group_name, course, lesson_number,
        topic, lesson_date, lesson_type, teacher_name, goals, objectives,
        expected_results, resources_methods, resources_technical,
        stage_organization, stage_knowledge, stage_new_skills,
        stage_consolidation, stage_assessment, stage_homework,
        stage_reflection, semester_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING *`,
      [
        userId, subject_name, module_code, group_name, course, lesson_number,
        topic, lesson_date, lesson_type, teacher_name, goals, objectives,
        expected_results, resources_methods, resources_technical,
        stage_organization, stage_knowledge, stage_new_skills,
        stage_consolidation, stage_assessment, stage_homework,
        stage_reflection, semester_hours
      ]
    );
    return result.rows[0];
  },

  /**
   * Обновить план урока
   */
  async update(id, planData, userId) {
    const {
      subject_name, module_code, group_name, course, lesson_number,
      topic, lesson_date, lesson_type, teacher_name, goals, objectives,
      expected_results, resources_methods, resources_technical,
      stage_organization, stage_knowledge, stage_new_skills,
      stage_consolidation, stage_assessment, stage_homework,
      stage_reflection, semester_hours
    } = planData;

    const result = await pool.query(
      `UPDATE lesson_plans SET
        subject_name = $1, module_code = $2, group_name = $3, course = $4,
        lesson_number = $5, topic = $6, lesson_date = $7, lesson_type = $8,
        teacher_name = $9, goals = $10, objectives = $11, expected_results = $12,
        resources_methods = $13, resources_technical = $14,
        stage_organization = $15, stage_knowledge = $16, stage_new_skills = $17,
        stage_consolidation = $18, stage_assessment = $19, stage_homework = $20,
        stage_reflection = $21, semester_hours = $22, updated_at = CURRENT_TIMESTAMP
      WHERE id = $23 AND user_id = $24
      RETURNING *`,
      [
        subject_name, module_code, group_name, course, lesson_number,
        topic, lesson_date, lesson_type, teacher_name, goals, objectives,
        expected_results, resources_methods, resources_technical,
        stage_organization, stage_knowledge, stage_new_skills,
        stage_consolidation, stage_assessment, stage_homework,
        stage_reflection, semester_hours, id, userId
      ]
    );
    return result.rows[0];
  },

  /**
   * Удалить план урока
   */
  async delete(id, userId) {
    const result = await pool.query(
      'DELETE FROM lesson_plans WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    return result.rows[0];
  },

  /**
   * Удалить все планы по предмету
   */
  async deleteBySubject(subjectName, userId) {
    const result = await pool.query(
      'DELETE FROM lesson_plans WHERE subject_name = $1 AND user_id = $2 RETURNING id',
      [subjectName, userId]
    );
    return result.rows;
  },

  /**
   * Создать множество планов (bulk insert)
   */
  async createMany(plans, userId) {
    const results = [];
    for (const plan of plans) {
      const result = await this.create(plan, userId);
      results.push(result);
    }
    return results;
  }
};

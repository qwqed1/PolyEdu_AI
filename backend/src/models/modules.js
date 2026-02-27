import pool from '../config/db.js';

export const ModuleModel = {
  /**
   * Инициализация таблиц модулей
   */
  async initTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        name TEXT NOT NULL,
        module_type VARCHAR(20) NOT NULL DEFAULT 'theory',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS module_subjects (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_modules_group_id ON modules(group_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_module_subjects_module_id ON module_subjects(module_id)');
  },

  /**
   * Получить все модули группы с предметами
   */
  async getAllByGroupId(groupId, userId) {
    // Проверяем что группа принадлежит пользователю
    const groupCheck = await pool.query(
      'SELECT id FROM groups WHERE id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (groupCheck.rows.length === 0) return null;

    const modules = await pool.query(
      `SELECT id, group_id, code, name, module_type, sort_order, created_at
       FROM modules
       WHERE group_id = $1
       ORDER BY module_type, sort_order, code`,
      [groupId]
    );

    // Для каждого модуля получаем предметы
    const result = [];
    for (const mod of modules.rows) {
      const subjects = await pool.query(
        `SELECT id, code, name, sort_order, created_at
         FROM module_subjects
         WHERE module_id = $1
         ORDER BY sort_order, code`,
        [mod.id]
      );
      result.push({
        ...mod,
        subjects: subjects.rows
      });
    }

    return result;
  },

  /**
   * Получить модуль по ID
   */
  async getById(id) {
    const result = await pool.query(
      `SELECT m.id, m.group_id, m.code, m.name, m.module_type, m.sort_order, m.created_at
       FROM modules m
       WHERE m.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;

    const subjects = await pool.query(
      `SELECT id, code, name, sort_order, created_at
       FROM module_subjects
       WHERE module_id = $1
       ORDER BY sort_order, code`,
      [id]
    );

    return {
      ...result.rows[0],
      subjects: subjects.rows
    };
  },

  /**
   * Создать модуль
   */
  async create(groupId, code, name, moduleType, sortOrder = 0) {
    const result = await pool.query(
      `INSERT INTO modules (group_id, code, name, module_type, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, group_id, code, name, module_type, sort_order, created_at`,
      [groupId, code, name, moduleType, sortOrder]
    );
    return { ...result.rows[0], subjects: [] };
  },

  /**
   * Обновить модуль
   */
  async update(id, code, name, moduleType) {
    const result = await pool.query(
      `UPDATE modules SET code = $1, name = $2, module_type = $3
       WHERE id = $4
       RETURNING id, group_id, code, name, module_type, sort_order, created_at`,
      [code, name, moduleType, id]
    );
    return result.rows[0];
  },

  /**
   * Удалить модуль
   */
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM modules WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Добавить предмет в модуль
   */
  async addSubject(moduleId, code, name, sortOrder = 0) {
    const result = await pool.query(
      `INSERT INTO module_subjects (module_id, code, name, sort_order)
       VALUES ($1, $2, $3, $4)
       RETURNING id, module_id, code, name, sort_order, created_at`,
      [moduleId, code, name, sortOrder]
    );
    return result.rows[0];
  },

  /**
   * Обновить предмет модуля
   */
  async updateSubject(id, code, name) {
    const result = await pool.query(
      `UPDATE module_subjects SET code = $1, name = $2
       WHERE id = $3
       RETURNING id, module_id, code, name, sort_order, created_at`,
      [code, name, id]
    );
    return result.rows[0];
  },

  /**
   * Удалить предмет из модуля
   */
  async deleteSubject(id) {
    const result = await pool.query(
      'DELETE FROM module_subjects WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  },

  /**
   * Проверить принадлежность модуля группе пользователя
   */
  async verifyOwnership(moduleId, userId) {
    const result = await pool.query(
      `SELECT m.id FROM modules m
       JOIN groups g ON g.id = m.group_id
       WHERE m.id = $1 AND g.user_id = $2`,
      [moduleId, userId]
    );
    return result.rows.length > 0;
  }
};

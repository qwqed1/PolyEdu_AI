import pool from '../config/db.js';

export const StatsModel = {
  /**
   * Получить общую статистику преподавателя
   */
  async getTeacherStats(userId) {
    // Количество групп
    const groupsResult = await pool.query(
      'SELECT COUNT(*) as count FROM groups WHERE user_id = $1',
      [userId]
    );
    
    // Количество студентов (во всех группах преподавателя)
    const studentsResult = await pool.query(
      `SELECT COUNT(DISTINCT s.id) as count 
       FROM students s
       JOIN groups g ON s.group_id = g.id
       WHERE g.user_id = $1`,
      [userId]
    );
    
    // Занятий на неделе (из расписания)
    const schedulesResult = await pool.query(
      'SELECT COUNT(*) as count FROM schedules WHERE user_id = $1',
      [userId]
    );
    
    // Средний балл по всем студентам преподавателя
    const avgGradeResult = await pool.query(
      `SELECT ROUND(AVG(gr.grade)::numeric, 2) as average_grade
       FROM grades gr
       JOIN students s ON gr.student_id = s.id
       JOIN groups g ON s.group_id = g.id
       WHERE g.user_id = $1`,
      [userId]
    );
    
    return {
      total_groups: parseInt(groupsResult.rows[0].count) || 0,
      total_students: parseInt(studentsResult.rows[0].count) || 0,
      weekly_lessons: parseInt(schedulesResult.rows[0].count) || 0,
      average_grade: avgGradeResult.rows[0].average_grade || null
    };
  },

  /**
   * Получить детальную статистику по группам
   */
  async getGroupsStats(userId) {
    const result = await pool.query(
      `SELECT 
        g.id,
        g.name,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(gr.id) as total_grades,
        ROUND(AVG(gr.grade)::numeric, 2) as average_grade,
        MIN(gr.grade) as min_grade,
        MAX(gr.grade) as max_grade
       FROM groups g
       LEFT JOIN students s ON s.group_id = g.id
       LEFT JOIN grades gr ON gr.student_id = s.id
       WHERE g.user_id = $1
       GROUP BY g.id, g.name
       ORDER BY g.name`,
      [userId]
    );
    return result.rows;
  },

  /**
   * Получить статистику по студентам
   */
  async getStudentsStats(userId) {
    const result = await pool.query(
      `SELECT 
        s.id,
        s.full_name,
        g.name as group_name,
        COUNT(gr.id) as total_grades,
        ROUND(AVG(gr.grade)::numeric, 2) as average_grade,
        MIN(gr.grade) as min_grade,
        MAX(gr.grade) as max_grade
       FROM students s
       JOIN groups g ON s.group_id = g.id
       LEFT JOIN grades gr ON gr.student_id = s.id
       WHERE g.user_id = $1
       GROUP BY s.id, s.full_name, g.name
       ORDER BY average_grade DESC NULLS LAST`,
      [userId]
    );
    return result.rows;
  }
};

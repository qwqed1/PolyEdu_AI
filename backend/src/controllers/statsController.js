import { StatsModel } from '../models/stats.js';

export const statsController = {
  /**
   * Получить общую статистику преподавателя
   * GET /api/stats/teacher
   */
  async getTeacherStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await StatsModel.getTeacherStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[Stats Controller] Error getting teacher stats:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении статистики'
      });
    }
  },

  /**
   * Получить детальную статистику
   * GET /api/stats/detailed
   */
  async getDetailedStats(req, res) {
    try {
      const userId = req.user.id;
      
      const [teacherStats, groupsStats, studentsStats] = await Promise.all([
        StatsModel.getTeacherStats(userId),
        StatsModel.getGroupsStats(userId),
        StatsModel.getStudentsStats(userId)
      ]);
      
      res.json({
        success: true,
        data: {
          summary: teacherStats,
          groups: groupsStats,
          students: studentsStats
        }
      });
    } catch (error) {
      console.error('[Stats Controller] Error getting detailed stats:', error);
      res.status(500).json({
        success: false,
        error: 'Ошибка при получении детальной статистики'
      });
    }
  }
};

import { GroupModel } from '../models/groups.js';
import { StudentModel } from '../models/students.js';

export const aiDataPublicController = {
  /**
   * Публичный endpoint для n8n (без JWT)
   * POST /api/ai-data/public/query
   */
  async query(req, res) {
    try {
      const { action, groupName, userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId required'
        });
      }
      
      console.log(`[AI Data Public] Action: ${action}, GroupName: ${groupName}, UserId: ${userId}`);
      
      let result = null;
      
      switch (action) {
        case 'get_groups':
          result = await this.getGroups(userId);
          break;
          
        case 'get_stats':
          result = await this.getStats(userId, groupName);
          break;
          
        case 'get_students':
          result = await this.getStudents(userId, groupName);
          break;
          
        default:
          return res.json({
            success: false,
            message: 'Unknown action'
          });
      }
      
      res.json(result);
    } catch (error) {
      console.error('[AI Data Public] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },
  
  async getGroups(userId) {
    let groups = await GroupModel.getAllByUserId(userId);
    
    // Fallback: если для userId=1 нет групп, берём все группы
    if (groups.length === 0 && userId == 1) {
      const pool = (await import('../config/db.js')).default;
      const result = await pool.query(`
        SELECT g.*, COUNT(s.id) as student_count 
        FROM groups g 
        LEFT JOIN students s ON s.group_id = g.id 
        GROUP BY g.id 
        ORDER BY g.created_at DESC
      `);
      groups = result.rows;
    }
    
    if (groups.length === 0) {
      return {
        success: true,
        message: 'У вас пока нет групп.',
        data: []
      };
    }
    
    let message = 'Ваши группы:\n\n';
    groups.forEach((g, i) => {
      message += `${i + 1}. ${g.name} - ${g.student_count || 0} студентов\n`;
    });
    
    return {
      success: true,
      message: message,
      data: groups
    };
  },
  
  async getStats(userId, groupName) {
    let groups = await GroupModel.getAllByUserId(userId);
    
    let targetGroup = null;
    if (groupName) {
      targetGroup = groups.find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
      );
      
      // Fallback: если не найдена среди групп пользователя, ищем среди всех
      if (!targetGroup) {
        console.log(`[getStats] Group ${groupName} not found for userId=${userId}, searching all groups...`);
        const pool = (await import('../config/db.js')).default;
        const result = await pool.query(
          `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
          [groupName]
        );
        if (result.rows.length > 0) {
          targetGroup = result.rows[0];
          console.log(`[getStats] Found group: ${targetGroup.name} (id=${targetGroup.id})`);
        }
      }
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }
    
    if (!targetGroup) {
      return {
        success: true,
        message: `Группа ${groupName || ''} не найдена.`,
        data: null
      };
    }
    
    const stats = await GroupModel.getStats(targetGroup.id, userId);
    
    let message = `Статистика для группы ${targetGroup.name}:\n\n`;
    message += `Студентов: ${stats.total_students || 0}\n`;
    message += `Средний балл: ${stats.average_grade || '-'}\n`;
    message += `Минимальный балл: ${stats.min_grade || '-'}\n`;
    message += `Максимальный балл: ${stats.max_grade || '-'}`;
    
    return {
      success: true,
      message: message,
      data: stats
    };
  },
  
  async getStudents(userId, groupName) {
    let groups = await GroupModel.getAllByUserId(userId);
    
    let targetGroup = null;
    if (groupName) {
      targetGroup = groups.find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
      );
      
      // Fallback: если не найдена среди групп пользователя, ищем среди всех
      if (!targetGroup) {
        console.log(`[getStudents] Group ${groupName} not found for userId=${userId}, searching all groups...`);
        const pool = (await import('../config/db.js')).default;
        const result = await pool.query(
          `SELECT g.* FROM groups g WHERE LOWER(g.name) = LOWER($1) LIMIT 1`,
          [groupName]
        );
        if (result.rows.length > 0) {
          targetGroup = result.rows[0];
          console.log(`[getStudents] Found group: ${targetGroup.name} (id=${targetGroup.id})`);
        }
      }
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }
    
    if (!targetGroup) {
      return {
        success: true,
        message: `Группа ${groupName || ''} не найдена.`,
        data: []
      };
    }
    
    const students = await StudentModel.getAllByGroupId(targetGroup.id);
    
    if (students.length === 0) {
      return {
        success: true,
        message: `В группе ${targetGroup.name} пока нет студентов.`,
        data: []
      };
    }
    
    let message = `Студенты группы ${targetGroup.name}:\n\n`;
    students.forEach((s, i) => {
      message += `${i + 1}. ${s.full_name}`;
      if (s.average_grade) {
        message += ` (средний балл: ${s.average_grade})`;
      }
      message += '\n';
    });
    
    return {
      success: true,
      message: message,
      data: students
    };
  }
};

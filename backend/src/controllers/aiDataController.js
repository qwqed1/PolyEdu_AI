import { GroupModel } from '../models/groups.js';
import { StudentModel } from '../models/students.js';
import { GradeModel } from '../models/grades.js';

export const aiDataController = {
  /**
   * Универсальный endpoint для AI запросов
   * POST /api/ai/query
   */
  async query(req, res) {
    try {
      const { action, groupName } = req.body;
      const userId = req.user.id;
      
      console.log(`[AI Data] Action: ${action}, GroupName: ${groupName}, UserId: ${userId}`);
      
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
          return res.status(400).json({
            success: false,
            error: 'Unknown action'
          });
      }
      
      res.json(result);
    } catch (error) {
      console.error('[AI Data] Error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  },
  
  async getGroups(userId) {
    const groups = await GroupModel.getAllByUserId(userId);
    
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
    const groups = await GroupModel.getAllByUserId(userId);
    
    let targetGroup = null;
    if (groupName) {
      targetGroup = groups.find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
      );
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }
    
    if (!targetGroup) {
      return {
        success: true,
        message: 'Группа не найдена.',
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
    const groups = await GroupModel.getAllByUserId(userId);
    
    let targetGroup = null;
    if (groupName) {
      targetGroup = groups.find(g => 
        g.name.toLowerCase() === groupName.toLowerCase()
      );
    } else if (groups.length > 0) {
      targetGroup = groups[0];
    }
    
    if (!targetGroup) {
      return {
        success: true,
        message: 'Группа не найдена.',
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

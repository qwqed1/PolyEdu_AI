import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/grades`;

class GradeService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить оценки студента
   */
  async getByStudentId(studentId) {
    try {
      const response = await axios.get(`${API_URL}?studentId=${studentId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении оценок');
    }
  }

  /**
   * Создать оценку
   */
  async create(studentId, subjectId, grade, topic, date) {
    try {
      const response = await axios.post(API_URL, {
        studentId,
        subjectId,
        grade,
        topic,
        date
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при добавлении оценки');
    }
  }

  /**
   * Удалить оценку
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении оценки');
    }
  }
}

export default new GradeService();

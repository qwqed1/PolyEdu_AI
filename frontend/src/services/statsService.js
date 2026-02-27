import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/stats`;

class StatsService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить общую статистику преподавателя
   */
  async getTeacherStats() {
    try {
      const response = await axios.get(`${API_URL}/teacher`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении статистики');
    }
  }

  /**
   * Получить детальную статистику
   */
  async getDetailedStats() {
    try {
      const response = await axios.get(`${API_URL}/detailed`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении детальной статистики');
    }
  }
}

export default new StatsService();

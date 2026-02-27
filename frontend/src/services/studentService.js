import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/students`;

class StudentService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить всех студентов группы
   */
  async getByGroupId(groupId) {
    try {
      const response = await axios.get(`${API_URL}?groupId=${groupId}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении студентов');
    }
  }

  /**
   * Создать студента
   */
  async create(fullName, groupId) {
    try {
      const response = await axios.post(API_URL, { fullName, groupId }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при добавлении студента');
    }
  }

  /**
   * Удалить студента
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении студента');
    }
  }

  /**
   * Массовое создание студентов
   */
  async bulkCreate(names, groupId) {
    try {
      const response = await axios.post(`${API_URL}/bulk`, { names, groupId }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при массовом добавлении студентов');
    }
  }
}

export default new StudentService();

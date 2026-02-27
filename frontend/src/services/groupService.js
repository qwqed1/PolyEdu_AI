import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/groups`;

class GroupService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить все группы
   */
  async getAll() {
    try {
      const response = await axios.get(API_URL, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении групп');
    }
  }

  /**
   * Получить группу по ID
   */
  async getById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении группы');
    }
  }

  /**
   * Создать группу
   */
  async create(name) {
    try {
      const response = await axios.post(API_URL, { name }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при создании группы');
    }
  }

  /**
   * Обновить группу
   */
  async update(id, name) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { name }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при обновлении группы');
    }
  }

  /**
   * Удалить группу
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении группы');
    }
  }

  /**
   * Получить статистику группы
   */
  async getStats(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}/stats`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении статистики');
    }
  }
}

export default new GroupService();

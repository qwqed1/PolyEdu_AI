import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/subjects`;

class SubjectService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить все предметы
   */
  async getAll() {
    try {
      const response = await axios.get(API_URL, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении предметов');
    }
  }

  /**
   * Создать предмет
   */
  async create(name) {
    try {
      const response = await axios.post(API_URL, { name }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при создании предмета');
    }
  }

  /**
   * Удалить предмет
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении предмета');
    }
  }
}

export default new SubjectService();

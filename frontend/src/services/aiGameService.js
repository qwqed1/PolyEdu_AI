import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/ai-games`;

class AIGameService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Сгенерировать игру через AI
   */
  async generate(prompt) {
    try {
      const response = await axios.post(`${API_URL}/generate`, { prompt }, {
        headers: this.getAuthHeaders(),
        timeout: 180000
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при генерации игры');
    }
  }

  /**
   * Сохранить сгенерированную игру
   */
  async save(title, prompt, htmlCode) {
    try {
      const response = await axios.post(`${API_URL}/save`, {
        title, prompt, html_code: htmlCode
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при сохранении игры');
    }
  }

  /**
   * Получить все сохранённые игры
   */
  async getAll() {
    try {
      const response = await axios.get(API_URL, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении игр');
    }
  }

  /**
   * Получить игру по ID
   */
  async getById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении игры');
    }
  }

  /**
   * Удалить игру
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении игры');
    }
  }
}

export default new AIGameService();

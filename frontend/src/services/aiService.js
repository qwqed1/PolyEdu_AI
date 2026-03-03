import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/ai`;

class AIService {
  async sendMessage(message, context = '') {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Необходима авторизация');
      }

      const response = await axios.post(
        `${API_URL}/chat`,
        { message, context },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        const errData = error.response.data.error || error.response.data.message;
        const errText = typeof errData === 'object' && errData !== null ? errData.message || JSON.stringify(errData) : errData;
        throw new Error(errText || 'Ошибка сервера');
      } else if (error.request) {
        throw new Error('Сервер не отвечает');
      } else {
        throw new Error(error.message);
      }
    }
  }

  async healthCheck() {
    try {
      const response = await axios.get(`${API_URL}/health`);
      return response.data;
    } catch {
      return { success: false, status: 'unhealthy' };
    }
  }
}

export default new AIService();

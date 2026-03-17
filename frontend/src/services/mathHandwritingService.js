import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/math/handwriting`;

class MathHandwritingService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async recognize(imageDataUrl, locale = 'ru') {
    try {
      const response = await axios.post(
        `${API_URL}/recognize`,
        {
          imageDataUrl,
          locale,
        },
        {
          headers: this.getAuthHeaders(),
        },
      );

      return response.data?.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Не удалось распознать запись');
    }
  }
}

export default new MathHandwritingService();

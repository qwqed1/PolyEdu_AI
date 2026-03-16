import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/chemistry`;

class ChemistryService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async searchCompound(query) {
    try {
      const response = await axios.get(`${API_URL}/compound`, {
        headers: this.getAuthHeaders(),
        params: { query },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Не удалось загрузить вещество');
    }
  }

  async getCompoundModel(id) {
    try {
      const response = await axios.get(`${API_URL}/compound/${id}/model`, {
        headers: this.getAuthHeaders(),
        responseType: 'text',
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || '3D-модель недоступна');
    }
  }

  async getReaction(left, right = '') {
    try {
      const response = await axios.get(`${API_URL}/reaction`, {
        headers: this.getAuthHeaders(),
        params: { left, right },
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Не удалось загрузить реакцию');
    }
  }
}

export default new ChemistryService();

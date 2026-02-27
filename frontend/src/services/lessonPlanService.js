import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/lesson-plans`;

class LessonPlanService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async generate(prompt) {
    const response = await axios.post(`${API_URL}/generate`, { prompt }, {
      headers: this.getAuthHeaders(),
      timeout: 300000
    });
    return response.data;
  }

  async getAll() {
    const response = await axios.get(API_URL, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getBySubject(subjectName) {
    const response = await axios.get(`${API_URL}/subject/${encodeURIComponent(subjectName)}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async getById(id) {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async create(planData) {
    const response = await axios.post(API_URL, planData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async createMany(plans) {
    const response = await axios.post(`${API_URL}/bulk`, { plans }, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async update(id, planData) {
    const response = await axios.put(`${API_URL}/${id}`, planData, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async delete(id) {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async deleteBySubject(subjectName) {
    const response = await axios.delete(`${API_URL}/subject/${encodeURIComponent(subjectName)}`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async initTable() {
    const response = await axios.post(`${API_URL}/init`);
    return response.data;
  }
}

export default new LessonPlanService();

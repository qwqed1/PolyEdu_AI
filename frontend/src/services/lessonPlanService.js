import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/lesson-plans`;

function parseFilename(dispositionHeader) {
  if (!dispositionHeader) {
    return 'lesson-plan.docx';
  }

  const utf8Match = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = dispositionHeader.match(/filename="?([^"]+)"?/i);
  return simpleMatch?.[1] || 'lesson-plan.docx';
}

class LessonPlanService {
  getAuthHeaders(contentType = 'application/json') {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    };
  }

  async downloadDocx(url) {
    const response = await axios.get(url, {
      headers: this.getAuthHeaders(null),
      responseType: 'blob',
    });

    return {
      blob: response.data,
      filename: parseFilename(response.headers['content-disposition']),
    };
  }

  async generate(prompt) {
    const response = await axios.post(
      `${API_URL}/generate`,
      { prompt },
      {
        headers: this.getAuthHeaders(),
        timeout: 300000,
      },
    );

    return response.data;
  }

  async getAll() {
    const response = await axios.get(API_URL, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getBySubject(subjectName) {
    const response = await axios.get(`${API_URL}/subject/${encodeURIComponent(subjectName)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getById(id) {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async exportDocx(id) {
    return this.downloadDocx(`${API_URL}/${id}/export-docx`);
  }

  async exportSubjectDocx(subjectName) {
    return this.downloadDocx(`${API_URL}/subject/${encodeURIComponent(subjectName)}/export-docx`);
  }

  async create(planData) {
    const response = await axios.post(API_URL, planData, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async createMany(plans) {
    const response = await axios.post(`${API_URL}/bulk`, { plans }, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async update(id, planData) {
    const response = await axios.put(`${API_URL}/${id}`, planData, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async publish(id, isPublic) {
    const response = await axios.patch(
      `${API_URL}/${id}/publish`,
      { is_public: isPublic },
      {
        headers: this.getAuthHeaders(),
      },
    );
    return response.data;
  }

  async delete(id) {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteBySubject(subjectName) {
    const response = await axios.delete(`${API_URL}/subject/${encodeURIComponent(subjectName)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async initTable() {
    const response = await axios.post(`${API_URL}/init`);
    return response.data;
  }
}

export default new LessonPlanService();

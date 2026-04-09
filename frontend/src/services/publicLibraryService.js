import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const publicLibraryService = {
  async getLibrary(params = {}) {
    const response = await axios.get(`${API_URL}/public/library`, { params });
    return response.data;
  },

  async getLessonPlan(id) {
    const response = await axios.get(`${API_URL}/public/lesson-plans/${id}`);
    return response.data;
  },

  async downloadLessonPlanDocx(id) {
    const response = await axios.get(`${API_URL}/public/lesson-plans/${id}/export-docx`, {
      responseType: 'blob',
    });
    return {
      blob: response.data,
      filename: parseFilename(response.headers['content-disposition']),
    };
  },

  async getQuiz(id) {
    const response = await axios.get(`${API_URL}/public/quizzes/${id}`);
    return response.data;
  },

  async submitQuizResult(id, payload) {
    const response = await axios.post(`${API_URL}/public/quizzes/${id}/results`, payload);
    return response.data;
  },

  async getGame(id) {
    const response = await axios.get(`${API_URL}/public/games/${id}`);
    return response.data;
  },

  async getGameHtml(id) {
    const response = await axios.get(`${API_URL}/public/games/${id}/html`, {
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return response.data;
  },
};

export default publicLibraryService;

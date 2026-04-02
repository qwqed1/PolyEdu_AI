import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const quizService = {
  async getQuizzes() {
    const response = await axios.get(`${API_URL}/quiz`, getAuthHeaders());
    return response.data;
  },

  async getQuizById(id) {
    const response = await axios.get(`${API_URL}/quiz/${id}`, getAuthHeaders());
    return response.data;
  },

  async createQuiz(quizData) {
    const response = await axios.post(`${API_URL}/quiz`, quizData, getAuthHeaders());
    return response.data;
  },

  async updateQuiz(id, quizData) {
    const response = await axios.put(`${API_URL}/quiz/${id}`, quizData, getAuthHeaders());
    return response.data;
  },

  async deleteQuiz(id) {
    const response = await axios.delete(`${API_URL}/quiz/${id}`, getAuthHeaders());
    return response.data;
  },

  async generateQuestions(topic, questionsCount = 5, difficulty = 'medium', type = 'multiple_choice') {
    const response = await axios.post(
      `${API_URL}/quiz/generate`,
      { topic, questionsCount, difficulty, type },
      getAuthHeaders()
    );
    return response.data;
  },

  async getStats() {
    const response = await axios.get(`${API_URL}/quiz/stats`, getAuthHeaders());
    return response.data;
  },

  async getQuizResults(id) {
    const response = await axios.get(`${API_URL}/quiz/${id}/results`, getAuthHeaders());
    return response.data;
  },

  async clearQuizResults(id) {
    const response = await axios.delete(`${API_URL}/quiz/${id}/results`, getAuthHeaders());
    return response.data;
  },
};

export default quizService;

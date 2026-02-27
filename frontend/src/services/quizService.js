import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const quizService = {
  /**
   * Получить все квизы
   */
  async getQuizzes() {
    const response = await axios.get(`${API_URL}/quiz`, getAuthHeaders());
    return response.data;
  },

  /**
   * Получить квиз по ID
   */
  async getQuizById(id) {
    const response = await axios.get(`${API_URL}/quiz/${id}`, getAuthHeaders());
    return response.data;
  },

  /**
   * Создать квиз
   */
  async createQuiz(quizData) {
    const response = await axios.post(`${API_URL}/quiz`, quizData, getAuthHeaders());
    return response.data;
  },

  /**
   * Обновить квиз
   */
  async updateQuiz(id, quizData) {
    const response = await axios.put(`${API_URL}/quiz/${id}`, quizData, getAuthHeaders());
    return response.data;
  },

  /**
   * Удалить квиз
   */
  async deleteQuiz(id) {
    const response = await axios.delete(`${API_URL}/quiz/${id}`, getAuthHeaders());
    return response.data;
  },

  /**
   * Активировать квиз (начать игру)
   */
  async activateQuiz(id) {
    const response = await axios.post(`${API_URL}/quiz/${id}/activate`, {}, getAuthHeaders());
    return response.data;
  },

  /**
   * Деактивировать квиз (завершить игру)
   */
  async deactivateQuiz(id) {
    const response = await axios.post(`${API_URL}/quiz/${id}/deactivate`, {}, getAuthHeaders());
    return response.data;
  },

  /**
   * Найти квиз по игровому коду (публичный) - возвращает данные для игры
   */
  async getQuizByCode(code) {
    const response = await axios.get(`${API_URL}/quiz/join/${code}`);
    // Теперь API возвращает { data, questions }
    return {
      data: response.data.data,
      questions: response.data.questions || []
    };
  },

  /**
   * Сгенерировать вопросы с ИИ
   */
  async generateQuestions(topic, questionsCount = 5, difficulty = 'medium', type = 'multiple_choice') {
    const response = await axios.post(
      `${API_URL}/quiz/generate`,
      { topic, questionsCount, difficulty, type },
      getAuthHeaders()
    );
    return response.data;
  },

  /**
   * Получить статистику квизов
   */
  async getStats() {
    const response = await axios.get(`${API_URL}/quiz/stats`, getAuthHeaders());
    return response.data;
  },

  /**
   * Сохранить результат игры (публичный)
   */
  async saveGameResult(code, resultData) {
    const response = await axios.post(`${API_URL}/quiz/play/${code}/result`, resultData);
    return response.data;
  },

  /**
   * Получить лидерборд игры (публичный)
   */
  async getLeaderboard(code) {
    const response = await axios.get(`${API_URL}/quiz/play/${code}/leaderboard`);
    return response.data;
  },

  /**
   * Получить все активные квизы (для студентов)
   */
  async getActiveQuizzes() {
    const response = await axios.get(`${API_URL}/quiz/active`);
    return response.data;
  },

  /**
   * Получить результаты квиза (для преподавателя)
   */
  async getQuizResults(id) {
    const response = await axios.get(`${API_URL}/quiz/${id}/results`, getAuthHeaders());
    return response.data;
  },

  /**
   * Очистить результаты квиза
   */
  async clearQuizResults(id) {
    const response = await axios.delete(`${API_URL}/quiz/${id}/results`, getAuthHeaders());
    return response.data;
  }
};

export default quizService;

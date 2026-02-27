import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class ModuleService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Получить все модули группы
   */
  async getByGroupId(groupId) {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/modules`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при получении модулей');
    }
  }

  /**
   * Создать модуль в группе
   */
  async create(groupId, code, name, moduleType) {
    try {
      const response = await axios.post(`${API_URL}/groups/${groupId}/modules`, {
        code, name, module_type: moduleType
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при создании модуля');
    }
  }

  /**
   * Обновить модуль
   */
  async update(id, code, name, moduleType) {
    try {
      const response = await axios.put(`${API_URL}/modules/${id}`, {
        code, name, module_type: moduleType
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при обновлении модуля');
    }
  }

  /**
   * Удалить модуль
   */
  async delete(id) {
    try {
      const response = await axios.delete(`${API_URL}/modules/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении модуля');
    }
  }

  /**
   * Добавить предмет в модуль
   */
  async addSubject(moduleId, code, name) {
    try {
      const response = await axios.post(`${API_URL}/modules/${moduleId}/subjects`, {
        code, name
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при добавлении предмета');
    }
  }

  /**
   * Удалить предмет из модуля
   */
  async deleteSubject(id) {
    try {
      const response = await axios.delete(`${API_URL}/module-subjects/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Ошибка при удалении предмета');
    }
  }
}

export default new ModuleService();

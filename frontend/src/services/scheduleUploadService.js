import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/schedule-upload`;

class ScheduleUploadService {
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Upload a docx schedule file
   */
  async upload(file, title, shift, weekType) {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (shift) formData.append('shift', shift);
    if (weekType) formData.append('weekType', weekType);

    const response = await axios.post(API_URL, formData, {
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Get all uploads for current user
   */
  async getUploads() {
    const response = await axios.get(API_URL, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get all unique group names
   */
  async getGroups() {
    const response = await axios.get(`${API_URL}/groups`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Get schedule by group name
   */
  async getByGroup(groupName) {
    const response = await axios.get(`${API_URL}/by-group/${encodeURIComponent(groupName)}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  /**
   * Delete an upload
   */
  async deleteUpload(id) {
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }
}

export default new ScheduleUploadService();

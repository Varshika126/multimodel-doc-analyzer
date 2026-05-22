import api from './api';

export const documentService = {
  // Upload documents
  upload: async (files, onProgress) => {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));
    const { data } = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return data;
  },

  process: async (documentId) => {
    const { data } = await api.post(`/documents/${documentId}/process`);
    return data;
  },

  getAll: async (params = {}) => {
    const { data } = await api.get('/documents', { params });
    return data;
  },

  getById: async (id) => {
    const { data } = await api.get(`/documents/${id}`);
    return data;
  },

  delete: async (id) => {
    const { data } = await api.delete(`/documents/${id}`);
    return data;
  },

  toggleFavorite: async (id) => {
    const { data } = await api.patch(`/documents/${id}/favorite`);
    return data;
  },

  share: async (id) => {
    const { data } = await api.post(`/documents/${id}/share`);
    return data;
  },

  getShared: async (token) => {
    const { data } = await api.get(`/documents/shared/${token}`);
    return data;
  }
};

export const analysisService = {
  getByDocument: async (documentId) => {
    const { data } = await api.get(`/analysis/${documentId}`);
    return data;
  },

  getAll: async (params = {}) => {
    const { data } = await api.get('/analysis', { params });
    return data;
  },

  getOverview: async () => {
    const { data } = await api.get('/analysis/overview');
    return data;
  }
};

export const reportService = {
  generatePDF: async (documentId) => {
    const response = await api.post(`/reports/pdf/${documentId}`, {}, {
      responseType: 'blob'
    });
    return response;
  },

  generateTXT: async (documentId) => {
    const response = await api.post(`/reports/txt/${documentId}`, {}, {
      responseType: 'blob'
    });
    return response;
  }
};

export const aiService = {
  askQuestion: async (documentId, question) => {
    const { data } = await api.post(`/ai/ask/${documentId}`, { question });
    return data;
  },

  summarize: async (documentId, style = 'concise') => {
    const { data } = await api.post(`/ai/summarize/${documentId}`, { style });
    return data;
  }
};

export const userService = {
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },

  updateProfile: async (profileData) => {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  },

  updatePassword: async (passwordData) => {
    const { data } = await api.put('/users/password', passwordData);
    return data;
  },

  updateSettings: async (settings) => {
    const { data } = await api.put('/users/settings', settings);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/users/stats');
    return data;
  }
};

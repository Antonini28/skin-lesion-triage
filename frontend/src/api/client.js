import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,  // 2 min — allows for Render cold start
});

/**
 * Upload a skin lesion image for classification.
 * @param {File} file
 * @returns {Promise<object>} PredictionResponse
 */
export const predictImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/**
 * Check API health status.
 * @returns {Promise<object>} HealthResponse
 */
export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;

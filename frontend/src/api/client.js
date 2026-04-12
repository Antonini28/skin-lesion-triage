import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 120000,
});

// Restore token on page load
const _token = localStorage.getItem('auth_token');
if (_token) api.defaults.headers.common['Authorization'] = `Bearer ${_token}`;

// ── ML ────────────────────────────────────────────────────────────────────────

export const predictImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const checkHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authRegister = async (body) => {
  const { data } = await api.post('/auth/register', body);
  return data;
};

export const authLogin = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const updateProfile = async (body) => {
  const { data } = await api.put('/auth/profile', body);
  return data;
};

// ── Scan history ──────────────────────────────────────────────────────────────

export const saveScan = async (scanData) => {
  const { data } = await api.post('/scans/save', scanData);
  return data;
};

export const getScanHistory = async () => {
  const { data } = await api.get('/scans/history');
  return data;
};

export const toggleFollowup = async (scanId) => {
  const { data } = await api.put(`/scans/${scanId}/followup`);
  return data;
};

export default api;

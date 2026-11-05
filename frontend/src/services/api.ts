import axios from 'axios';

const api = axios.create({
  // In production: VITE_API_URL = https://your-backend.onrender.com/api/v1
  // In development: Vite proxy handles /api → localhost:8000
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('wf_token');
      localStorage.removeItem('wf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

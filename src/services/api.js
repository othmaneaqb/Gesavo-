import axios from 'axios';

// Create an Axios instance pointing to the Django backend
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Interceptor to automatically add the JWT token to headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized! Token might be expired.");
      // Clear token and force login if needed
      // localStorage.removeItem('access_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// src/utils/api.js
// Create this new file in your frontend

import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to automatically add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If token expired or unauthorized
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
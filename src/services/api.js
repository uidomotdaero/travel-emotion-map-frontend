import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export default apiClient;
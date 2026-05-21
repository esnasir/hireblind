import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: '/api', // Adjust if API Gateway is on a different port
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  const isAuthEndpoint =
    config.url?.includes('/auth/login') ||
    config.url?.includes('/auth/refresh');

  if (!isAuthEndpoint && token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

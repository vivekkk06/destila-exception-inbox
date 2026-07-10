import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

export const getExceptions = (params) => api.get('/exceptions', { params });
export const getExceptionDetail = (id) => api.get(`/exceptions/${id}`);
export const patchException = (id, status) => api.patch(`/exceptions/${id}`, { status });

export default api;

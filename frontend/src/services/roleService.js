import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + "/api/roles";

const roleApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

roleApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const roleService = {
  getRoles: async () => {
    try {
      const response = await roleApi.get('/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch roles');
    }
  },

  getPermissions: async () => {
    try {
      const response = await roleApi.get('/permissions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions');
    }
  },

  createRole: async (roleData) => {
    try {
      const response = await roleApi.post('/', roleData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create role');
    }
  }
};

export default roleService;

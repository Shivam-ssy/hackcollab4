import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + "/api/colleges";

const collegeApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

collegeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const collegeService = {
  getMyCollege: async () => {
    try {
      const response = await collegeApi.get('/me');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch my college');
    }
  },

  getAllColleges: async () => {
    try {
      const response = await collegeApi.get('/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch colleges');
    }
  },

  approveCollege: async (collegeId) => {
    try {
      const response = await collegeApi.put(`/${collegeId}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve college');
    }
  },

  updateSubscription: async (collegeId, status) => {
    try {
      const response = await collegeApi.put(`/${collegeId}/subscription`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update subscription status');
    }
  }
};

export default collegeService;

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + "/api/payments";

const paymentApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

paymentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const paymentService = {
  createOrder: async () => {
    try {
      const response = await paymentApi.post('/create-order');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const response = await paymentApi.post('/verify', paymentData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }
};

export default paymentService;

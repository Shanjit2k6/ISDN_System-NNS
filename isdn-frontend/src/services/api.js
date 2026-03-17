import axios from 'react'; // React imported just in case, though not needed here
import rawAxios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = rawAxios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to automatically attach the Firebase ID token
api.interceptors.request.use(
  async (config) => {
    // If a user is logged in, grab their current token
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API call detected - potentially expired token or missing auth.");
      // Optionally handle forced logout here: auth.signOut()
    }
    return Promise.reject(error);
  }
);

export default api;

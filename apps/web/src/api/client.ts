import axios from 'axios';

import { store } from '../store';
import { clearAuth } from '../store/auth.slice';

const apiBaseURL = (
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`
).replace('localhost', window.location.hostname);

const apiClient = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(clearAuth());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export { apiClient };

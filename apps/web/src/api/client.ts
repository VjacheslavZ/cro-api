import axios from 'axios';

import { store } from '../store';
import { clearAuth, setCredentials } from '../store/auth.slice';
import { getAccessToken, getRefreshToken, setTokens } from '../shared/lib/auth-storage';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
            refreshToken,
          });
          const user = store.getState().auth.user!;
          setTokens(data.accessToken, data.refreshToken);

          store.dispatch(setCredentials({ user }));
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(originalRequest);
        } catch {
          store.dispatch(clearAuth());
          window.location.href = '/login';
        }
      } else {
        store.dispatch(clearAuth());
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export { apiClient };

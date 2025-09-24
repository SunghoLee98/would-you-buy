import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, removeTokens, setTokens } from '../utils/auth';
import { RefreshTokenResponse, ApiResponse } from '../types/auth.types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7070/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (error.response.data && typeof error.response.data === 'object' &&
          'errors' in error.response.data) {
        const errorData = error.response.data as ApiResponse;

        // Check if it's a token expiry issue - API 명세서 준수: errors 배열 체크
        if (errorData.errors?.some(err => err.code === 'TOKEN_EXPIRED')) {
          originalRequest._retry = true;

          if (!isRefreshing) {
            isRefreshing = true;
            const refreshToken = getRefreshToken();

            if (refreshToken) {
              try {
                const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
                  `${API_BASE_URL}/auth/refresh`,
                  { refreshToken }
                );

                if (response.data.success && response.data.data) {
                  const { accessToken } = response.data.data;
                  setTokens(accessToken, refreshToken);
                  onTokenRefreshed(accessToken);
                  isRefreshing = false;

                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                  return api(originalRequest);
                }
              } catch (refreshError) {
                removeTokens();
                window.location.href = '/login';
                return Promise.reject(refreshError);
              } finally {
                isRefreshing = false;
              }
            } else {
              removeTokens();
              window.location.href = '/login';
            }
          }

          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            });
          });
        }
      }

      // For other 401 errors, redirect to login
      removeTokens();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SecureStorageService } from './secureStore';

const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    if (__DEV__ && Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl.trim();
  }

  // Dev fallback only if EXPO_PUBLIC_API_URL is missing
  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2
        ?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5001/api`;
      }
    }
    return 'http://10.0.2.2:5001/api';
  }

  return 'https://api.invalid/api';
};

const baseURL = getApiBaseUrl();
if (__DEV__) {
  console.log('[API Base URL]:', baseURL);
}

// Render / VPS network requests timeout configuration
// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRIES = 2;

const isRetryableNetworkError = (error: unknown): boolean => {
  const err = error as { code?: string; message?: string; response?: unknown };
  if (err.response) return false;
  const message = (err.message || '').toLowerCase();
  return (
    err.code === 'ECONNABORTED' ||
    err.code === 'ERR_NETWORK' ||
    message.includes('network error') ||
    message.includes('timeout')
  );
};

// Request Interceptor: Attach backend JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStorageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: retry cold-start failures; clear session on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const retryConfig = error.config as (typeof error.config & { _retryCount?: number }) | undefined;
    if (retryConfig && isRetryableNetworkError(error)) {
      const currentRetry = retryConfig._retryCount || 0;
      retryConfig._retryCount = currentRetry + 1;
      if (retryConfig._retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 4000 * (retryConfig._retryCount || 1)));
        return api.request(retryConfig);
      }
    }

    if (error.response && error.response.status === 401) {
      await SecureStorageService.clearAuthSession();
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.setState({
        user: null,
        jwt: null,
        isAuthenticated: false,
        error: null,
        isLoading: false,
      });
    }

    if (isRetryableNetworkError(error)) {
      return Promise.reject(
        new Error(
          `Cannot reach the server (${baseURL}). Please check your connection or backend server status.`,
        ),
      );
    }

    return Promise.reject(error);
  },
);

export default api;

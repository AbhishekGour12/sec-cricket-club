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

const isFormDataBody = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  return Array.isArray((data as { _parts?: unknown })._parts);
};

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRIES = 1;

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

const shouldRetryRequest = (config: { method?: string; url?: string; data?: unknown } | undefined): boolean => {
  if (!config) return false;
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'get') return false;
  const url = String(config.url || '');
  if (url.includes('/auth/google')) return false;
  if (isFormDataBody(config.data)) return false;
  return true;
};

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStorageService.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isFormDataBody(config.data)) {
      config.timeout = Math.max(config.timeout || 0, 60000);
      if (config.headers) {
        delete (config.headers as { 'Content-Type'?: string })['Content-Type'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const retryConfig = error.config as (typeof error.config & { _retryCount?: number }) | undefined;
    if (retryConfig && isRetryableNetworkError(error) && shouldRetryRequest(retryConfig)) {
      const currentRetry = retryConfig._retryCount || 0;
      retryConfig._retryCount = currentRetry + 1;
      if (retryConfig._retryCount <= MAX_RETRIES) {
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

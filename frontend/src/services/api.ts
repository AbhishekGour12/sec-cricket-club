import axios from 'axios';
import { resolveApiBaseUrl } from '@/config/apiUrl';
import { SecureStorageService } from './secureStore';

const baseURL = resolveApiBaseUrl();
console.log('[API Base URL]:', baseURL);

const isFormDataBody = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  return Array.isArray((data as { _parts?: unknown })._parts);
};

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MAX_RETRIES = 1;
const AUTH_MAX_RETRIES = 1;
const AUTH_RETRY_DELAY_MS = 200;

export const isRetryableNetworkError = (error: unknown): boolean => {
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

const shouldRetryAuthRequest = (config: { method?: string; url?: string } | undefined): boolean => {
  if (!config) return false;
  const method = (config.method || 'get').toLowerCase();
  if (method !== 'post') return false;
  return String(config.url || '').includes('/auth/google');
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    if (retryConfig && isRetryableNetworkError(error)) {
      const currentRetry = retryConfig._retryCount || 0;
      const maxRetries = shouldRetryAuthRequest(retryConfig) ? AUTH_MAX_RETRIES : MAX_RETRIES;

      if (currentRetry < maxRetries && (shouldRetryAuthRequest(retryConfig) || shouldRetryRequest(retryConfig))) {
        retryConfig._retryCount = currentRetry + 1;
        const delayMs = shouldRetryAuthRequest(retryConfig)
          ? AUTH_RETRY_DELAY_MS * retryConfig._retryCount
          : 0;
        if (delayMs > 0) {
          await sleep(delayMs);
        }
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
      const err = error as { code?: string; message?: string };
      const detail = err.code || err.message || 'network error';
      const networkError = new Error(
        `Cannot reach the server (${baseURL}). Please check your connection or backend server status.`,
      ) as Error & { code?: string; isNetworkError?: boolean; detail?: string };
      networkError.code = err.code;
      networkError.isNetworkError = true;
      networkError.detail = detail;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  },
);

export default api;

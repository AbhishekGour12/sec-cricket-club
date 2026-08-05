import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { SecureStorageService } from './secureStore';

const getApiBaseUrl = (): string => {
  // Dev only: derive LAN IP from Metro so physical devices can hit the local API.
  if (__DEV__) {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2
        ?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:5000/api`;
      }
    }

    let envUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      envUrl = envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }

  // Release / App Store: require HTTPS API — App Transport Security blocks cleartext.
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!productionUrl) {
    console.error(
      '[API] EXPO_PUBLIC_API_URL is required in production builds. Set it in EAS secrets.',
    );
    return 'https://api.invalid/api';
  }

  if (productionUrl.startsWith('http://')) {
    console.warn(
      '[API] Production API URL uses HTTP. App Store builds should use HTTPS for ATS compliance.',
    );
  }

  return productionUrl;
};

const baseURL = getApiBaseUrl();
if (__DEV__) {
  console.log('[API Base URL]:', baseURL);
}

// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Response Interceptor: Catch JWT expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await SecureStorageService.clearAuthSession();
    }
    return Promise.reject(error);
  },
);

export default api;

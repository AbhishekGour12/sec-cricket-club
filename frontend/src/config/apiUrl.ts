import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const PRODUCTION_API_URL = 'https://sec-api.duckdns.org/api';
const DEPRECATED_RENDER_HOST = 'sec-cricket-club.onrender.com';

const normalizeApiUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.includes(DEPRECATED_RENDER_HOST)) {
    return PRODUCTION_API_URL;
  }
  if (__DEV__ && Platform.OS === 'android' && trimmed.includes('localhost')) {
    return trimmed.replace('localhost', '10.0.2.2');
  }
  return trimmed;
};

const getDevFallbackUrl = (): string => {
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
};

export const resolveApiBaseUrl = (): string => {
  const extraUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;
  const envUrl = process.env.EXPO_PUBLIC_API_URL || extraUrl;

  if (envUrl && envUrl.trim().length > 0) {
    return normalizeApiUrl(envUrl);
  }

  if (__DEV__) {
    return getDevFallbackUrl();
  }

  return PRODUCTION_API_URL;
};

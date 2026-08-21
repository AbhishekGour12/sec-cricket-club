import { getApiUrl } from '../lib/api';

/**
 * Builds an absolute media URL for admin panel.
 * Always resolves /uploads/ paths to the current API server URL from VITE_API_URL,
 * and upgrades HTTP to HTTPS if the admin panel is served over HTTPS.
 */
export const getAdminMediaUrl = (imagePath?: string | null, fallback = ''): string => {
  if (!imagePath) return fallback;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('data:')) return trimmed;

  // Active base server URL from VITE_API_URL (e.g. https://sec-api.duckdns.org/api -> https://sec-api.duckdns.org)
  const apiUrl = getApiUrl();
  const serverUrl = apiUrl.replace(/\/api\/?$/, '');

  // If path contains /uploads/, extract the relative upload path and attach to serverUrl
  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativeUploadPath = trimmed.substring(uploadsIndex);
    return serverUrl ? `${serverUrl}${relativeUploadPath}` : relativeUploadPath;
  }

  // If relative path
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return serverUrl ? `${serverUrl}${cleanPath}` : cleanPath;
  }

  // If URL uses http:// and admin page or serverUrl is https://, upgrade to https://
  if (trimmed.startsWith('http://') && (window.location.protocol === 'https:' || serverUrl.startsWith('https:'))) {
    return trimmed.replace('http://', 'https://');
  }

  return trimmed;
};

import { getApiUrl } from '../lib/api';

/**
 * Builds an absolute media URL for admin panel.
 * Resolves /uploads/ paths through /api/uploads so Nginx SPA fallback
 * (location /) cannot swallow image requests.
 */
export const getAdminMediaUrl = (imagePath?: string | null, fallback = ''): string => {
  if (!imagePath) return fallback;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('data:')) return trimmed;

  const apiUrl = getApiUrl();
  const serverUrl = apiUrl.replace(/\/api\/?$/, '');

  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativeUploadPath = trimmed.substring(uploadsIndex);
    const apiUploadsPath = relativeUploadPath.startsWith('/api/')
      ? relativeUploadPath
      : `/api${relativeUploadPath}`;
    return serverUrl ? `${serverUrl}${apiUploadsPath}` : apiUploadsPath;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && (window.location.protocol === 'https:' || serverUrl.startsWith('https:'))) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  return fallback;
};

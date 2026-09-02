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

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const apiUrl = getApiUrl();
  const serverUrl = apiUrl.replace(/\/api\/?$/, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && (window.location.protocol === 'https:' || serverUrl.startsWith('https:'))) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  // Handle all relative paths (e.g. /uploads/..., uploads/..., userprofile/..., flyers/..., or filename.jpg)
  let cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('/api/uploads/')) {
    if (cleanPath.startsWith('/userprofile/') || cleanPath.startsWith('/flyers/')) {
      cleanPath = `/uploads${cleanPath}`;
    } else {
      cleanPath = `/uploads/userprofile${cleanPath}`;
    }
  }

  const apiUploadsPath = cleanPath.startsWith('/api/') ? cleanPath : `/api${cleanPath}`;
  return serverUrl ? `${serverUrl}${apiUploadsPath}` : apiUploadsPath;
};

import { getApiUrl } from '../lib/api';

/**
 * Builds an absolute media URL for admin panel.
 * Always resolves /uploads/ paths to the current API server URL from VITE_API_URL,
 * upgrades HTTP to HTTPS if the admin panel is served over HTTPS,
 * and rejects plain non-path text strings (like "fghjk").
 */
export const getAdminMediaUrl = (imagePath?: string | null, fallback = ''): string => {
  if (!imagePath) return fallback;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return fallback;

  if (trimmed.startsWith('data:')) return trimmed;

  // Active base server URL from VITE_API_URL
  const apiUrl = getApiUrl();
  const serverUrl = apiUrl.replace(/\/api\/?$/, '');

  // If path contains /uploads/, extract the relative upload path and attach to serverUrl
  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativeUploadPath = trimmed.substring(uploadsIndex);
    return serverUrl ? `${serverUrl}${relativeUploadPath}` : relativeUploadPath;
  }

  // If full HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && (window.location.protocol === 'https:' || serverUrl.startsWith('https:'))) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  // Reject random non-path plain strings (e.g. "fghjk")
  return fallback;
};

import api from '@/services/api';

/**
 * Builds an absolute media URL for uploaded images.
 * Always resolves relative upload paths and replaces legacy/localhost/http origins with the current API server URL.
 * Safely rejects plain non-path text strings (like "fghjk") to prevent broken 404 image requests.
 */
export const getMediaUrl = (imagePath?: string | null): string | undefined => {
  if (!imagePath) return undefined;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return undefined;

  // Local device URI or data URI
  if (trimmed.startsWith('file:') || trimmed.startsWith('content:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Determine active base server URL from .env or api instance
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL || api.defaults.baseURL || '';
  const serverUrl = envApiUrl.replace(/\/api\/?$/, '');

  // If path contains /uploads/, extract relative upload path and append to active serverUrl
  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativeUploadPath = trimmed.substring(uploadsIndex);
    return serverUrl ? `${serverUrl}${relativeUploadPath}` : relativeUploadPath;
  }

  // If full HTTP/HTTPS URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && serverUrl.startsWith('https://')) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  // Plain text strings (e.g. "fghjk") that are not paths are safely rejected
  return undefined;
};

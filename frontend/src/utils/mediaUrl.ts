import { resolveApiBaseUrl } from '@/config/apiUrl';
import api from '@/services/api';

/**
 * Builds an absolute media URL for uploaded images.
 * Resolves /uploads/ paths through /api/uploads so Nginx SPA fallback
 * cannot swallow image requests on the shared DuckDNS host.
 */
export const getMediaUrl = (imagePath?: string | null): string | undefined => {
  if (!imagePath) return undefined;
  const trimmed = String(imagePath).trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('file:') || trimmed.startsWith('content:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const envApiUrl = resolveApiBaseUrl() || api.defaults.baseURL || '';
  const serverUrl = envApiUrl.replace(/\/api\/?$/, '');

  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativeUploadPath = trimmed.substring(uploadsIndex);
    const apiUploadsPath = relativeUploadPath.startsWith('/api/')
      ? relativeUploadPath
      : `/api${relativeUploadPath}`;
    return serverUrl ? `${serverUrl}${apiUploadsPath}` : apiUploadsPath;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && serverUrl.startsWith('https://')) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  return undefined;
};

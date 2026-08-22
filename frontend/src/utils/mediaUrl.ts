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

  let envApiUrl = resolveApiBaseUrl() || api.defaults.baseURL || '';
  if (envApiUrl.startsWith('/')) {
    envApiUrl = 'https://sec-api.duckdns.org/api';
  }
  const serverUrl = envApiUrl.replace(/\/api\/?$/, '');

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (trimmed.startsWith('http://') && serverUrl.startsWith('https://')) {
      return trimmed.replace('http://', 'https://');
    }
    return trimmed;
  }

  // Handle all relative paths (e.g. /uploads/..., uploads/..., userprofile/..., or filename.jpg)
  let cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!cleanPath.startsWith('/uploads/') && !cleanPath.startsWith('/api/uploads/')) {
    if (cleanPath.startsWith('/userprofile/')) {
      cleanPath = `/uploads${cleanPath}`;
    } else {
      cleanPath = `/uploads/userprofile${cleanPath}`;
    }
  }

  const apiUploadsPath = cleanPath.startsWith('/api/') ? cleanPath : `/api${cleanPath}`;
  return `${serverUrl}${apiUploadsPath}`;
};

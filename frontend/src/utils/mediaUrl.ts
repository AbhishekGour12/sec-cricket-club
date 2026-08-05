import api from '@/services/api';

/**
 * Builds an absolute media URL for uploaded images.
 * Avoids shipping localhost/HTTP fallbacks in production App Store builds.
 */
export const getMediaUrl = (imagePath?: string | null): string | undefined => {
  if (!imagePath) return undefined;
  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('file:') ||
    imagePath.startsWith('content:') ||
    imagePath.startsWith('data:')
  ) {
    return imagePath;
  }

  const serverUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') ?? '';
  if (!serverUrl) return undefined;
  return `${serverUrl}/${imagePath.replace(/^\//, '')}`;
};

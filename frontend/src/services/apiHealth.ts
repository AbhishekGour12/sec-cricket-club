import { resolveApiBaseUrl } from '@/config/apiUrl';

const HEALTH_PATH = '/health';
const HEALTH_TIMEOUT_MS = 8000;

export async function checkApiReachable(): Promise<boolean> {
  const baseUrl = resolveApiBaseUrl();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${HEALTH_PATH}`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function warmApiConnection(): Promise<void> {
  try {
    await checkApiReachable();
  } catch {
    // Warm-up is best-effort only.
  }
}

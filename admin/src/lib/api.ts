import axios from 'axios';

export const getApiUrl = () =>
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const getAdminToken = () => localStorage.getItem('admin_jwt');

export const clearAdminSession = () => {
  localStorage.removeItem('admin_jwt');
  localStorage.removeItem('admin_user');
};

/** Force a full reload so App auth state resets cleanly. */
export const logoutAdmin = () => {
  clearAdminSession();
  window.location.href = '/login';
};

export const adminApi = axios.create({
  timeout: 20000,
});

adminApi.interceptors.request.use((config) => {
  config.baseURL = getApiUrl();
  const token = getAdminToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = String(error?.config?.url || '');
    const onLoginPage = window.location.pathname.includes('/login');
    // Session probe is handled by App boot — avoid redirect loops.
    if (status === 401 && !onLoginPage && !url.includes('/admin/auth/me')) {
      clearAdminSession();
      window.dispatchEvent(new Event('admin-auth-changed'));
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

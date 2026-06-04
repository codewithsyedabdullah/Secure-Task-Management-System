import axios from 'axios';

// In production: requests go to /api/... which Vercel proxies to Railway
// This makes cookies same-domain — fixes Safari ITP blocking third-party cookies
// In dev: Vite proxy handles /api -> localhost:5000
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err.response?.status === 401 &&
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

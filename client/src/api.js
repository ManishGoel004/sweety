import axios from 'axios';

const TOKEN_KEY = 'sweety_token';
const USER_KEY = 'sweety_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add the login token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired, log the user out and send them to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Turns an API error into a message we can show in the UI
export function getErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (!error.response) return 'Cannot reach the server. Is it running?';
  return 'Something went wrong. Please try again.';
}

export function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  return token && user ? { token, user: JSON.parse(user) } : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export default api;

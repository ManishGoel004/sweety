import { createContext, useContext, useState } from 'react';
import api, { saveSession, loadSession, clearSession } from './api';

// Shares the logged-in user with every page
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Stay logged in after a page refresh
  const [user, setUser] = useState(() => loadSession()?.user || null);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    setUser(data.user);
  }

  async function register(name, email, password) {
    const { data } = await api.post('/auth/register', { name, email, password });
    saveSession(data.token, data.user);
    setUser(data.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

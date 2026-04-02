import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || '/api';

const normalizeUser = (user) => ({
  ...user,
  role: user?.role || 'teacher',
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      const normalizedUser = normalizeUser(response.data);

      if (normalizedUser.role !== 'teacher') {
        logout();
        return;
      }

      setUser(normalizedUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token: nextToken, user: nextUser } = response.data;
    const normalizedUser = normalizeUser(nextUser);

    if (normalizedUser.role !== 'teacher') {
      throw new Error('Student accounts are no longer supported');
    }

    localStorage.setItem('token', nextToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${nextToken}`;
    setToken(nextToken);
    setUser(normalizedUser);

    return normalizedUser;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      ...userData,
      role: 'teacher',
    });
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

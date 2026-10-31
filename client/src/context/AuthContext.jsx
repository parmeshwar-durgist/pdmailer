import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [smtpStatus, setSmtpStatus] = useState({ configured: false, connected: false, loading: true });

  const refreshSmtpStatus = async () => {
    try {
      const res = await api.get('/email/health');
      const status = {
        configured: !!res.data.configured,
        connected: !!res.data.success,
        loading: false
      };
      setSmtpStatus(status);
      return status;
    } catch (e) {
      const status = { configured: false, connected: false, loading: false };
      setSmtpStatus(status);
      return status;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
          // Check SMTP status for authenticated user
          await refreshSmtpStatus();
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user: userData, token: jwtToken } = res.data.data;
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(jwtToken);
    await refreshSmtpStatus();
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { user: userData, token: jwtToken } = res.data.data;
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(jwtToken);
    await refreshSmtpStatus();
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setSmtpStatus({ configured: false, connected: false, loading: false });
      window.location.href = '/login';
    }
  };

  const isAdmin = user?.role === 'admin';
  const isSmtpReady = smtpStatus.connected === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        smtpStatus,
        isSmtpReady,
        refreshSmtpStatus,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

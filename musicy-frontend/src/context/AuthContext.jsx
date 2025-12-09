import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage
    const storedUser = localStorage.getItem('musicy_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (googleUser) => {
    // Register/Login with backend
    try {
      const res = await api.post('/api/auth/google', {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture
      });

      const userData = { ...googleUser, ...res.data.user };
      setUser(userData);
      localStorage.setItem('musicy_user', JSON.stringify(userData));
    } catch (err) {
      console.error("Backend login failed", err);
      // Fallback for demo if backend fails (e.g. CORS or network)
      setUser(googleUser);
      localStorage.setItem('musicy_user', JSON.stringify(googleUser));
    }
  };

  const loginWithPassword = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('musicy_user', JSON.stringify(userData));
    if (res.data.token) localStorage.setItem('musicy_token', res.data.token);
    return userData;
  };

  const registerWithPassword = async (email, password, name) => {
    const res = await api.post('/api/auth/register', { email, password, name });
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('musicy_user', JSON.stringify(userData));
    if (res.data.token) localStorage.setItem('musicy_token', res.data.token);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('musicy_user');
    localStorage.removeItem('musicy_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithPassword, registerWithPassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

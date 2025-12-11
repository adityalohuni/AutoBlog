import { useState, useEffect } from 'react';
import { login as apiLogin, setAuthCredentials } from '../api/client';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('adminUser');
      const storedPass = localStorage.getItem('adminPass');
      if (storedUser && storedPass) {
        try {
          await apiLogin(storedUser, storedPass);
          setAuthCredentials(storedUser, storedPass);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auto-login failed:', error);
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminPass');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    await apiLogin(username, password);
    setAuthCredentials(username, password);
    localStorage.setItem('adminUser', username);
    localStorage.setItem('adminPass', password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminPass');
    setAuthCredentials('', '');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, login, logout };
};

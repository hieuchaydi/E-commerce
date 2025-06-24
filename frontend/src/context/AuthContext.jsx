import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setAuthToken } from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('User fetch error:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // Memoize fetchUser, no dependencies

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // Include fetchUser in dependency array

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      await fetchUser();
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      await fetchUser();
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      if (error.response?.status === 401) {
        setAuthToken(null);
      } else {
        throw error;
      }
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
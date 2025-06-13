import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setAuthToken } from '../api/api'; // Import thêm setAuthToken

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
      // Xử lý lỗi 401 (token không hợp lệ)
      if (error.response?.status === 401) {
        setAuthToken(null); // Xóa token từ API
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    // AuthAPI đã tự động xử lý token (setAuthToken)
    await fetchUser(); // Fetch user mới sau khi login
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    // AuthAPI đã tự động xử lý token (setAuthToken)
    await fetchUser(); // Fetch user mới sau khi register
    return response.data;
  };

  const logout = useCallback(async () => {
    try {
      await authAPI.logout(); // Gọi API logout (đã xử lý setAuthToken)
    } catch (error) {
      console.error('Logout API error:', error);
      // Xử lý lỗi 401 (token không hợp lệ)
      if (error.response?.status === 401) {
        setAuthToken(null); // Vẫn xóa token nếu gặp lỗi
      }
    } finally {
      // Luôn đảm bảo dọn dẹp client-side
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
    setUser // Cho các cập nhật thủ công nếu cần
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
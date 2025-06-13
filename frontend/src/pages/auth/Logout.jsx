import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logout = () => {
  const { logout } = useAuth(); // Sử dụng hàm logout từ context
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout(); // Sử dụng hàm logout tập trung từ context
      navigate('/login');
    } catch (error) {
      console.error('Logout process error:', error);
      // Ngay cả khi có lỗi, vẫn chuyển hướng về login
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="logout-button"
    >
      {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
    </button>
  );
};

export default Logout;
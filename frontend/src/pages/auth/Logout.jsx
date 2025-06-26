import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logout = () => {
  const { logout, user } = useAuth(); // Also get user to verify state
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout(); // Call logout from AuthContext
      // Verify user is null after logout
      if (!user) {
        navigate('/login', { replace: true });
      } else {
        console.error('User state not cleared after logout');
        // Force navigation even if user state is not cleared
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate to login even on error to ensure UI consistency
      navigate('/login', { replace: true });
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
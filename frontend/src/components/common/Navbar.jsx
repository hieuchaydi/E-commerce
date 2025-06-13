import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, cartAPI } from '../../api/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      try {
        await cartAPI.clearCart();
      } catch (cartError) {
        console.error('Lỗi xóa giỏ hàng:', cartError);
      }
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo text-2xl sm:text-3xl font-bold text-blue-500 hover:text-blue-600">
            E-Commerce
          </Link>
        </div>

        <div className="navbar-search flex-1 max-w-md mx-4 hidden sm:block">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button
              type="submit"
              className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-md px-4 hover:bg-blue-500 hover:text-white transition-colors"
              aria-label="Tìm kiếm"
            >
              <i className="search-icon">🔍</i>
            </button>
          </form>
        </div>

        <button
          className="sm:hidden text-gray-600 hover:text-blue-500 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>

        <div
          className={`navbar-menu flex-col sm:flex-row sm:flex items-center gap-4 absolute sm:static top-16 left-0 w-full sm:w-auto bg-white sm:bg-transparent shadow-md sm:shadow-none p-4 sm:p-0 transition-all duration-300 ${
            isMenuOpen ? 'flex' : 'hidden'
          }`}
        >
          <Link to="/" className="nav-link text-gray-600 hover:text-blue-500 text-sm sm:text-base font-medium">
            Trang chủ
          </Link>
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link to="/cart" className="nav-link text-gray-600 hover:text-blue-500 text-sm sm:text-base font-medium">
                    Giỏ hàng
                  </Link>
                  <Link to="/orders" className="nav-link text-gray-600 hover:text-blue-500 text-sm sm:text-base font-medium">
                    Đơn hàng
                  </Link>
                </>
              )}
              {user.role === 'seller' && (
                <Link
                  to="/seller/products"
                  className="nav-link text-gray-600 hover:text-blue-500 text-sm sm:text-base font-medium"
                >
                  Quản lý sản phẩm
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin/dashboard"
                  className="nav-link text-gray-600 hover:text-blue-500 text-sm sm:text-base font-medium"
                >
                  Bảng điều khiển
                </Link>
              )}
              <div className="user-section flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1">
                <span className="user-info text-sm text-gray-600">
                  Xin chào, <strong className="text-gray-800">{user.username}</strong> ({user.role})
                </span>
                <Link to="/profile" className="nav-link text-sm text-gray-600 hover:text-blue-500 font-medium">
                  Hồ sơ
                </Link>
                <button
                  onClick={handleLogout}
                  className="logout-btn text-sm text-gray-600 hover:text-red-500 font-medium"
                  aria-label="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links flex flex-col sm:flex-row gap-2">
              <Link to="/login" className="login-link text-blue-500 border border-blue-500 rounded-full px-4 py-2 hover:bg-blue-50 text-sm">
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="register-link bg-blue-500 text-white rounded-full px-4 py-2 hover:bg-blue-600 text-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
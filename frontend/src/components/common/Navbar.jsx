import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, cartAPI, ordersAPI } from '../../api/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [latestOrderId, setLatestOrderId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      await cartAPI.clearCart().catch((err) => console.error('Error clearing cart:', err));
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      navigate('/login', { replace: true });
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?seller=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setIsMenuOpen(false);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user && user.role === 'customer') {
        try {
          const response = await ordersAPI.getOrders();
          const orders = response.results || response;
          if (Array.isArray(orders) && orders.length > 0) {
            setLatestOrderId(orders[0].id);
          }
        } catch (err) {
          console.error('Error fetching orders:', err.message);
        }
      }
    };
    fetchOrders();
  }, [user]);

  return (
    <nav className={`navbar ${isDarkMode ? 'dark' : ''}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            E-Commerce
          </Link>
        </div>
        <div className="navbar-search hidden sm:flex flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="flex w-full">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên người bán..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="navbar-search-input"
              aria-label="Search by seller name"
            />
            <button
              type="submit"
              className="navbar-search-button"
              disabled={!searchTerm.trim()}
            >
              Tìm
            </button>
          </form>
        </div>
        <button
          className="navbar-toggle sm:hidden"
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
          className={`navbar-menu ${
            isMenuOpen ? 'flex' : 'hidden'
          } sm:flex sm:static sm:w-auto sm:bg-transparent sm:shadow-none sm:p-0`}
        >
          {isMenuOpen && (
            <form onSubmit={handleSearch} className="navbar-search-mobile sm:hidden w-full mb-6">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên người bán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="navbar-search-input"
                aria-label="Search by seller name on mobile"
              />
              <button
                type="submit"
                className="navbar-search-button mt-2"
                disabled={!searchTerm.trim()}
              >
                Tìm
              </button>
            </form>
          )}
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Trang chủ
          </Link>
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link to="/cart" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Giỏ hàng
                  </Link>
                  <Link to="/orders" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Lịch sử đơn hàng
                  </Link>
                  {latestOrderId && (
                    <Link
                      to={`/orders/${latestOrderId}`}
                      className="nav-link"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Chi tiết đơn hàng
                    </Link>
                  )}
                  <Link to="/messages/2" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Tin nhắn
                  </Link>
                </>
              )}
              {user.role === 'seller' && (
                <>
                  <Link
                    to="/seller/products"
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Quản lý sản phẩm
                  </Link>
                  <Link
                    to="/seller/orders"
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Quản lý đơn hàng
                  </Link>
                  <Link to="/messages/2" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Tin nhắn
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className="nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                  <Link to="/messages/2" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Tin nhắn
                  </Link>
                </>
              )}
              <div className="user-section">
                <span className="user-info">
                  Xin chào, <strong>{user.username}</strong> ({user.role})
                </span>
                <Link
                  to="/profile"
                  className="nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Trang cá nhân
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="logout-btn"
                  aria-label="Logout"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link
                to="/login"
                className="auth-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="auth-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Đăng ký
              </Link>
            </div>
          )}
          <button
            onClick={() => {
              toggleDarkMode();
              setIsMenuOpen(false);
            }}
            className="dark-mode-toggle"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;